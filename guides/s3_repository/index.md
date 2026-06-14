# Publishing to S3

End-to-end walkthrough for turning an S3 bucket (or any S3-compatible storage) into a public DEB/RPM/pacman repository.

If you do not already have a preference, **Cloudflare R2 is recommended** — it is the most-tested provider in this project, charges nothing for egress (so serving packages is free), and includes 10 GB of free storage.

## AWS S3

### 1. Create the bucket

S3 console → **Create bucket**. Pick a region (e.g. `eu-central-1`) and a globally-unique name. Leave "Block all public access" on for now — step 3 turns the right parts of it off.

### 2. Create an IAM user with access keys

Access keys come from **IAM**, not S3. Do not use the root account.

1. IAM → **Users** → **Create user** (e.g. `omnipackage-publisher`). Programmatic access only, no console login.

1. Attach an inline policy scoped to this single bucket:

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

1. **Security credentials** → **Create access key** → "Application running outside AWS". Copy both into your env file as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — the secret is shown only once and cannot be retrieved later.

From GitHub Actions, prefer OIDC with an IAM role over static keys.

### 3. Make objects publicly readable

S3 buckets are private by default behind two independent gates; both must allow public reads.

**Block Public Access (BPA)** — bucket-level master switch. **Permissions** → **Block public access (bucket settings)** → Edit. Uncheck:

- "Block public access to buckets and objects granted through *new* public bucket or access point policies"
- "Block public access to buckets and objects granted through *any* public bucket or access point policies"

Leave the two ACL boxes checked — modern buckets use policies, not ACLs.

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

The `Resource` ARN ends in `/*` (objects), not the bare bucket. With both gates in place, objects are reachable at `https://<bucket-name>.s3.<region>.amazonaws.com/<key>`.

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

- `bucket_public_url` — virtual-hosted REST endpoint (`https://<bucket>.s3.<region>.amazonaws.com`). Serves HTTPS once the bucket policy is in place. Do not use the `s3-website` endpoint (HTTP-only).
- `endpoint` — regional S3 API endpoint, e.g. `https://s3.eu-central-1.amazonaws.com`.
- `region` — actual AWS region. AWS requires it for SigV4 (R2 uses `auto`; AWS does not).
- `force_path_style: false` — AWS uses virtual-hosted-style; path-style is deprecated.

### 5. Troubleshooting

`AccessDenied` on the public URL almost always means:

1. **BPA still blocking the policy.** Permissions tab should show "Public" once both BPA and the policy are correct.
1. **Bucket policy missing `/*`** on the resource ARN, or wrong bucket name.
1. **Object doesn't exist.** Verify with `aws s3 ls s3://<bucket>/<prefix>/`. AWS returns `AccessDenied` instead of `NoSuchKey` when `s3:ListBucket` isn't granted, masking missing objects.

## Cloudflare R2

R2 is S3-compatible with a few quirks.

### 1. Create the bucket

Cloudflare dashboard → **R2** → **Create bucket**. R2 names are scoped to your account, not globally unique.

### 2. Make it public via a custom subdomain

R2 does not expose a public `*.r2.cloudflarestorage.com` URL — that endpoint is API-only and requires signed requests. Public access requires a **custom subdomain** under a Cloudflare-managed zone:

Bucket → **Settings** → **Public access** → **Custom Domains** → **Connect Domain** → enter e.g. `repositories-test.omnipackage.org`. Cloudflare provisions DNS and TLS automatically.

The `r2.dev` subdomain is rate-limited and meant for development; do not use it for a real repo.

### 3. Create R2 API credentials

R2 dashboard → **Manage R2 API Tokens** → **Create API token**. Permissions: **Object Read & Write**, scoped to the bucket. Cloudflare returns an Access Key ID, Secret Access Key, and the S3 API endpoint (`https://<account-id>.r2.cloudflarestorage.com`).

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

- `bucket_public_url` — your custom subdomain. Must be the public-facing host, **not** the R2 API endpoint.
- `endpoint` — the R2 S3 API endpoint, account-scoped. Used only for uploads.
- `region: auto` — R2 ignores region; SigV4 still needs *some* value, and `auto` is what Cloudflare documents.
- `force_path_style: true` — required. R2's endpoint is account-scoped, so the bucket goes in the path.

### 5. CDN cache purge (optional)

Custom-subdomain R2 traffic flows through Cloudflare's edge, which caches `GET` responses. Without purging, stale repo metadata (`Release`, `Packages.gz`, `repodata/`, the pacman `.db.tar.gz`) can be served until TTL expires.

If both `cloudflare_zone_id` and `cloudflare_api_token` are set, OmniPackage purges the affected URL prefix after each upload. They are treated as a pair — if either is missing, the purge step is skipped silently. A purge failure logs a warning but does not fail the publish.

To get them:

- **Zone ID** — Cloudflare dashboard → your domain → **Overview** sidebar (right side).
- **API token** — **My Profile** → **API Tokens** → **Create Token** → custom token with **Zone → Cache Purge → Purge** scoped to the zone. Do not use the global API key.

Skip if you can tolerate edge TTL on repo updates.

## Google Cloud Storage

GCS speaks an S3-compatible API.

### 1. Create the bucket

Console → **Cloud Storage** → **Buckets** → **+ Create**. Names are globally unique. Set **Access control = Uniform bucket-level access**.

### 2. Service account + HMAC keys

GCS authenticates the S3 API with **HMAC keys**, not JSON service-account files. Bind the key to a dedicated service account so it can be rotated independently.

1. **IAM & Admin** → **Service Accounts** → create `omnipackage-publisher`.
1. Bucket → **Permissions** → **Grant access**. Principal = service account email; role = **Storage Object Admin**.
1. **Cloud Storage** → **Settings** → **Interoperability** → **+ Create a key for a service account** → pick the publisher SA.
1. Copy the access key and secret into your env file as `GCS_HMAC_ACCESS_KEY_ID` and `GCS_HMAC_SECRET_ACCESS_KEY`.

### 3. Make objects publicly readable

- **Public access prevention** (Configuration tab) → **Off**.
- **Permissions** → **Grant access**: principal `allUsers`, role **Storage Object Viewer**.

The bucket header then shows a "Public to internet" badge.

### 4. Repository config

```yaml
- name: GCS europe-southwest1
  provider: s3
  gpg_private_key_base64: "${GPG_PRIVATE_KEY_BASE64}"
  package_name: "sample-project"
  s3:
    bucket: omnipackage-repos
    path_in_bucket: "sample-project"
    bucket_public_url: "https://storage.googleapis.com/omnipackage-repos"
    endpoint: "https://storage.googleapis.com"
    access_key_id: "${GCS_HMAC_ACCESS_KEY_ID}"
    secret_access_key: "${GCS_HMAC_SECRET_ACCESS_KEY}"
    region: europe-southwest1
    force_path_style: true
```

Field notes:

- `bucket_public_url` — path-style. Do not use virtual-hosted (`<bucket>.storage.googleapis.com`).
- `endpoint` — single global endpoint; no regional variant.
- `region` — must match the bucket's actual location. SigV4 is region-bound; do not use `auto`.
- `force_path_style: true` — required; virtual-hosted style trips signature mismatches.

### 5. Cache and custom domains

GCS serves public objects with `Cache-Control: public, max-age=3600` by default, so republished repo metadata can be stale for up to an hour. Override the bucket-default `Cache-Control` or set per-object headers if that matters.

GCS cannot serve a custom domain over HTTPS on its own. Either put a Google HTTPS Load Balancer with a backend bucket in front, or front it with Cloudflare — in the Cloudflare case the `cloudflare_zone_id` / `cloudflare_api_token` fields are useful for cache purges, same as the R2 setup.
