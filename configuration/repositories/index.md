# `repositories`

Each entry describes one publishing target. `publish` and `release` select one with `--repository <name>`; if omitted, the first entry is used.

## Common keys

| Key                      | Required | Description                                                                                                                                                             |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                   | yes      | Human-readable identifier; passed to `--repository`                                                                                                                     |
| `provider`               | yes      | `s3` or `localfs`                                                                                                                                                       |
| `gpg_private_key_base64` | yes      | Base64-wrapped ASCII-armored private key; normally `${GPG_KEY}`                                                                                                         |
| `package_name`           | yes      | Package name rendered into the install page and used as the project slug under `path_in_bucket`                                                                         |
| `retain_packages`        | no       | Number of previously published packages kept per distro, on top of each new build. Default `0` keeps only the latest build. See [Package retention](#package-retention) |

## Provider: `localfs`

Writes the repository tree to a host directory instead of a bucket — the same standard repo, no S3 required. Useful for testing, same-machine installs, and self-hosting.

```yaml
- name: Local test
  provider: localfs
  localfs:
    path: /tmp/omnipackage-repos
  gpg_private_key_base64: "${GPG_KEY}"
```

See [Publishing to a local directory](https://docs.omnipackage.org/guides/localfs_repository/index.md) for what gets written and how to serve it.

## Provider: `s3`

Uploads to an S3 bucket or any S3-compatible storage.

| Key                    | Required | Description                                                                                 |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `bucket`               | yes      | Bucket name                                                                                 |
| `endpoint`             | yes      | Full S3 endpoint URL                                                                        |
| `access_key_id`        | yes      | Usually `${...}` from env                                                                   |
| `secret_access_key`    | yes      | Usually `${...}` from env                                                                   |
| `region`               | no       | Region string; required by some providers                                                   |
| `path_in_bucket`       | no       | Subdirectory prefix inside the bucket                                                       |
| `bucket_public_url`    | no       | Public URL base used in the generated install page                                          |
| `force_path_style`     | no       | Default `false`; set `true` for MinIO, some R2/B2 setups                                    |
| `cloudflare_zone_id`   | no       | Zone ID to purge after upload. Requires `cloudflare_api_token`; either one alone is ignored |
| `cloudflare_api_token` | no       | API token used for the purge. Requires `cloudflare_zone_id`                                 |

See [Publishing to S3](https://docs.omnipackage.org/guides/s3_repository/index.md) for an end-to-end walkthrough.

## Package retention

`retain_packages` sets how many previously published packages are kept per distro, alongside the new build. With `retain_packages: 3`, each `publish`/`release` keeps the three most recent `.deb`/`.rpm`/`.pkg.tar.zst` files per distro plus the one just built, and removes the rest. The default `0` keeps only the latest build.

On each run, before uploading the new package:

1. Existing packages are fetched from the target.
1. The N most recent by modification time are kept; older ones are pruned.
1. The new package is uploaded, metadata is regenerated, and pruned packages are deleted from the backend (bucket or local path).

Counting is per distro and per package type, and includes nested subdirectories. Retained packages are not re-uploaded.

```yaml
- name: Releases
  provider: s3
  retain_packages: 3
  s3:
    bucket: my-bucket
    endpoint: https://s3.example.com
  gpg_private_key_base64: "${GPG_KEY}"
  package_name: myapp
```
