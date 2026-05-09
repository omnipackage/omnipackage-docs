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
| [`ignore_source_files`](ignore_source_files.md) | no | Patterns for files to exclude from the staged source tree |

## Environment substitution

Any string value in `config.yml` can reference an environment variable with `${VAR}` syntax. Values resolve from a `.env` file (project root by default, override with `--env-file <path>`) or from the process environment. Only variables actually referenced in `config.yml` are consumed.

A `.env` file is the recommended default because it keeps every value in one place — the same file works for local runs and copy-pastes cleanly into a single CI secret. In CI specifically, passing values directly through the runner's environment (per-secret env vars on the step) can be cleaner if you want fine-grained per-secret rotation; both styles work, and they can be mixed.

<!-- TODO: pointer to a "minimal config" example -->
