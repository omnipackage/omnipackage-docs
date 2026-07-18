---
description: Overview of OmniPackage's `.omnipackage/config.yml` — every top-level key (builds, repositories, secrets, version_extractors, image_caches) with links to detailed reference pages.
---

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

Any string in `config.yml` can reference an environment variable with `${VAR}`. Values resolve from a `.env` file (project root by default, override with `--env-file <path>`) or from the process environment. Only variables referenced in `config.yml` are consumed.

A `.env` file is the recommended default: one place for every value, usable both locally and as a single CI secret. In CI you can also pass values directly through the runner's environment, which makes per-secret rotation easier. The two styles mix freely.

<!-- TODO: pointer to a "minimal config" example -->
