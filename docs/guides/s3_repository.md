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
