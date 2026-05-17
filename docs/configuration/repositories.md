---
description: "`repositories` reference — publishing targets (S3-compatible storage, local paths) where the built DEB/RPM packages and repo metadata are uploaded."
---

# `repositories`

Each entry describes one publishing target. `publish` and `release` select one with `--repository <name>`; if omitted, the first entry is used.

## Common keys

| Key | Required | Description |
|-----|----------|-------------|
| `name` | yes | Human-readable identifier; passed to `--repository` |
| `provider` | yes | `s3` or `localfs` |
| `gpg_private_key_base64` | yes | Base64-wrapped ASCII-armored private key; normally `${GPG_KEY}` |
| `package_name` | yes | Package name rendered into the install page and used as the project slug under `path_in_bucket` |

## Provider: `localfs`

Writes the repository tree to a host directory. Useful for testing.

```yaml
- name: Local test
  provider: localfs
  localfs:
    path: /tmp/omnipackage-repos
  gpg_private_key_base64: "${GPG_KEY}"
```

## Provider: `s3`

Uploads to an S3 bucket or any S3-compatible storage.

| Key | Required | Description |
|-----|----------|-------------|
| `bucket` | yes | Bucket name |
| `endpoint` | yes | Full S3 endpoint URL |
| `access_key_id` | yes | Usually `${...}` from env |
| `secret_access_key` | yes | Usually `${...}` from env |
| `region` | no | Region string; required by some providers |
| `path_in_bucket` | no | Subdirectory prefix inside the bucket |
| `bucket_public_url` | no | Public URL base used in the generated install page |
| `force_path_style` | no | Default `false`; set `true` for MinIO, some R2/B2 setups |
| `cloudflare_zone_id` | no | Zone ID to purge after upload. Requires `cloudflare_api_token`; either one alone is ignored |
| `cloudflare_api_token` | no | API token used for the purge. Requires `cloudflare_zone_id` |

See [Publishing to S3](../guides/s3_repository.md) for an end-to-end walkthrough.

<!-- TODO: -->
