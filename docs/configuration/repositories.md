# `repositories`

Each entry describes one publishing target. The `publish` and `release` commands pick one by name with `--repository <name>`; if omitted, the first entry is used.

## Common keys

| Key | Required | Description |
|-----|----------|-------------|
| `name` | yes | Human-readable identifier; passed to `--repository` |
| `provider` | yes | `s3` or `localfs` |
| `gpg_private_key_base64` | yes | Base64-wrapped ASCII-armored private key; normally `${GPG_KEY}` |
| `package_name` | no | Overrides the package name used in the generated install page |

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

Uploads to an S3 bucket (any S3-compatible storage).

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
| `cloudflare_zone_id` | no | If set, purge this CF zone after upload |
| `cloudflare_api_token` | no | Token used for the CF purge |

See the [Publishing to S3](../guides/s3_repository.md) guide for an end-to-end walkthrough.

<!-- TODO: -->
