# Configuration

OmniPackage reads `.omnipackage/config.yml` from the project root. This section documents every top-level key.

## Top-level keys

| Key | Required | Purpose |
|-----|----------|---------|
| [`version_extractors`](version_extractors.md) | yes | How to determine the package version |
| [`builds`](builds.md) | yes | Per-distro build configuration |
| [`repositories`](repositories.md) | no | Where to publish built packages |
| [`image_caches`](image_caches.md) | no | Cached container images to speed up builds |
| [`secrets`](secrets.md) | no | Environment-variable substitution into `config.yml` |

## Environment substitution

Any string value in `config.yml` can reference an environment variable with `${VAR}` syntax. Values come from `.env` (default) or `--env-file <path>`. No hidden env settings — only variables referenced in `config.yml` are consumed.

<!-- TODO: pointer to a "minimal config" example -->
