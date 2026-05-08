# Publishing to S3

End-to-end walkthrough for turning an S3 bucket (or any S3-compatible storage) into a public DEB/RPM repository.

## Scope

- Bucket setup (public read, static hosting)
- Minimal `repositories:` config block for S3
- Credentials: `access_key_id`, `secret_access_key`, `region`, `endpoint`
- Custom endpoints: Backblaze B2, Cloudflare R2, MinIO, etc. (`force_path_style`)
- Optional Cloudflare cache purge (`cloudflare_zone_id`, `cloudflare_api_token`)
- `bucket_public_url` for building install-page links
- Running `omnipackage release . --repository <name>` to target the S3 entry
- Verifying the generated `install.html`

<!-- TODO: -->

## AWS S3

> Draft — to be refined.

### 1. Create the bucket

S3 console → **Create bucket**. Pick a region (e.g. `eu-central-1`) and a globally-unique name. A convention that works well is to encode the account ID and region into the name, e.g. `omnipackage-repositories-<account-id>-<region>-<suffix>`. Leave "Block all public access" on for now — we'll selectively turn parts of it off in step 3.

### 2. Create an IAM user with access keys

Access keys come from **IAM**, not S3. Don't use the root account.

1. IAM → **Users** → **Create user** (e.g. `omnipackage-publisher`). Programmatic access only; no console login.
2. Attach an inline policy scoped to this single bucket:

    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
          "Resource": "arn:aws:s3:::<bucket-name>"
        },
        {
          "Effect": "Allow",
          "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:AbortMultipartUpload"],
          "Resource": "arn:aws:s3:::<bucket-name>/*"
        }
      ]
    }
    ```

3. User → **Security credentials** → **Create access key** → "Application running outside AWS". The Access Key ID and Secret Access Key are shown **once** — copy both into your env file as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. The secret cannot be retrieved later, only rotated.

If publishing from GitHub Actions, prefer OIDC + an IAM role over static keys.

### 3. Make objects publicly readable

AWS S3 buckets are private by default with two independent gates. Both must allow public reads.

**Block Public Access (BPA)** — bucket-level master switch.

S3 → bucket → **Permissions** → **Block public access (bucket settings)** → Edit. Uncheck at minimum:

- "Block public access to buckets and objects granted through *new* public bucket or access point policies"
- "Block public access to buckets and objects granted through *any* public bucket or access point policies"

Leave the two ACL-related boxes checked — modern buckets use policies, not ACLs.

**Bucket policy** — the actual grant. Same Permissions tab → **Bucket policy** → Edit:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<bucket-name>/*"
    }
  ]
}
```

Note `Resource` ends in `/*` (objects), not the bare bucket ARN.

After both, objects are reachable at `https://<bucket-name>.s3.<region>.amazonaws.com/<key>`.

ACLs are disabled by default on new buckets (Object Ownership = "Bucket owner enforced"). The policy above doesn't depend on ACLs — don't re-enable them.

### 4. Repository config

```yaml
- name: AWS S3 eu-central-1
  provider: s3
  gpg_private_key_base64: "${GPG_PRIVATE_KEY_BASE64}"
  package_name: "sample-project"
  s3:
    bucket: omnipackage-repositories-891377066957-eu-central-1-an
    path_in_bucket: "sample-project"
    bucket_public_url: "https://omnipackage-repositories-891377066957-eu-central-1-an.s3.eu-central-1.amazonaws.com"
    endpoint: "https://s3.eu-central-1.amazonaws.com"
    access_key_id: "${AWS_ACCESS_KEY_ID}"
    secret_access_key: "${AWS_SECRET_ACCESS_KEY}"
    region: eu-central-1
    force_path_style: false
```

Field notes:

- `bucket_public_url` — the URL clients will fetch from. The virtual-hosted REST endpoint (`https://<bucket>.s3.<region>.amazonaws.com`) gives HTTPS out of the box once the bucket policy in step 3 is in place. Don't use the `s3-website` endpoint — HTTP-only, requires static website hosting. Swap this to your custom domain once CloudFront is in front.
- `endpoint` — the regional S3 API endpoint, e.g. `https://s3.eu-central-1.amazonaws.com`.
- `region` — the actual AWS region (`eu-central-1`, `us-east-1`, …). AWS requires it for SigV4. (R2 uses `auto`; AWS does not.)
- `force_path_style: false` — AWS uses virtual-hosted-style; path-style is deprecated. Bucket names without dots work cleanly with HTTPS in virtual-hosted style.

### 5. Troubleshooting

`AccessDenied` on the public URL almost always means one of:

1. BPA still blocking the policy — check the Permissions tab; the bucket should *not* show "Bucket and objects not public" once both BPA and the policy are correct (it'll say "Public").
2. Bucket policy missing `/*` on the resource ARN, or wrong bucket name.
3. Object actually doesn't exist — verify with `aws s3 ls s3://<bucket-name>/<prefix>/`. AWS returns `AccessDenied` instead of `NoSuchKey` when `s3:ListBucket` isn't granted to the principal, which can mask missing objects.

## Cloudflare R2

> Draft — to be refined.

R2 is S3-compatible but has a few quirks that matter for the config block.

### 1. Create the bucket

Cloudflare dashboard → **R2** → **Create bucket**. Name it (e.g. `repositories-test`); R2 buckets are scoped to your account, not globally unique.

### 2. Make it public via a custom subdomain

R2 does not expose a public `*.r2.cloudflarestorage.com` URL — that endpoint is API-only and requires signed requests. The supported way to serve a bucket publicly is to attach a **custom subdomain** under a Cloudflare-managed zone:

Bucket → **Settings** → **Public access** → **Custom Domains** → **Connect Domain** → enter e.g. `repositories-test.omnipackage.org`. Cloudflare provisions the DNS record and TLS cert automatically (the zone must already be on Cloudflare).

The other public option, `r2.dev` subdomains, is rate-limited and meant for development; don't use it for a real repo.

### 3. Create R2 API credentials

R2 dashboard → **Manage R2 API Tokens** → **Create API token**. Permissions: **Object Read & Write**, scoped to the specific bucket. Cloudflare returns an **Access Key ID** and **Secret Access Key** (S3-compatible) plus the **S3 API endpoint** (`https://<account-id>.r2.cloudflarestorage.com`). Copy all three into your env file.

### 4. Repository config

```yaml
- name: test repo on Cloudflare R2
  provider: s3
  gpg_private_key_base64: "${GPG_PRIVATE_KEY_BASE64}"
  package_name: "sample-project"
  s3:
    bucket: repositories-test
    path_in_bucket: "sample-project"
    bucket_public_url: "https://repositories-test.omnipackage.org"
    endpoint: "${CLOUDFLARE_R2_ENDPOINT}"
    access_key_id: "${CLOUDFLARE_R2_ACCESS_KEY_ID}"
    secret_access_key: "${CLOUDFLARE_R2_SECRET_ACCESS_KEY}"
    region: auto
    force_path_style: true
    # Optional — see "CDN cache purge" below
    cloudflare_zone_id: "${CLOUDFLARE_ZONE_ID}"
    cloudflare_api_token: "${CLOUDFLARE_API_TOKEN}"
```

Field notes:

- `bucket_public_url` — your custom subdomain. This is what ends up in the generated install page; it must be the public-facing host, **not** the R2 API endpoint.
- `endpoint` — the R2 S3 API endpoint, account-scoped: `https://<account-id>.r2.cloudflarestorage.com`. Used only for uploads.
- `region: auto` — R2 ignores region for routing; SigV4 still needs *some* value, and `auto` is what Cloudflare documents.
- `force_path_style: true` — required. R2's endpoint is account-scoped, so the bucket goes in the path (`<endpoint>/<bucket>/<key>`), not as a subdomain prefix. Virtual-hosted-style does not work against R2.

### 5. CDN cache purge (optional)

Custom-subdomain R2 traffic flows through Cloudflare's edge, which caches `GET` responses. After republishing, stale repo metadata (`Release`, `Packages.gz`, `repodata/`) can be served until TTL expires.

If you set both `cloudflare_zone_id` and `cloudflare_api_token`, omnipackage calls Cloudflare's `purge_cache` API by URL prefix after each upload (`src/publish.rs:101`). Both fields are optional and treated as a pair — if either is missing, the purge step is skipped silently. A purge failure is logged as a warning and does not fail the publish.

To get them:

- **Zone ID** — Cloudflare dashboard → your domain → **Overview** sidebar (right side).
- **API token** — **My Profile** → **API Tokens** → **Create Token** → custom token with permission **Zone → Cache Purge → Purge** scoped to the specific zone. Don't use the global API key.

Skip these if you're not serving R2 through a custom subdomain (no Cloudflare cache to purge), or if you can tolerate edge TTL for repo updates.

## Cache invalidation (CloudFront)

> TODO: when CloudFront is added in front of S3, mirror the existing R2/Cloudflare purge flow with `CreateInvalidation`. Path patterns instead of URL prefixes; first 1000 paths/month free, ~$0.005/path after.
