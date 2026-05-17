# Configuration

OmniPackage reads `.omnipackage/config.yml` from the project root. This section documents every top-level key.

## Top-level keys

| Key                                                                                              | Required | Purpose                                                   |
| ------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------- |
| [`version_extractors`](https://docs.omnipackage.org/configuration/version_extractors/index.md)   | yes      | How to determine the package version                      |
| [`builds`](https://docs.omnipackage.org/configuration/builds/index.md)                           | yes      | Per-distro build configuration                            |
| [`repositories`](https://docs.omnipackage.org/configuration/repositories/index.md)               | no       | Where to publish built packages                           |
| [`image_caches`](https://docs.omnipackage.org/configuration/image_caches/index.md)               | no       | Cached container images to speed up builds                |
| [`secrets`](https://docs.omnipackage.org/configuration/secrets/index.md)                         | no       | Environment-variable substitution into `config.yml`       |
| [`ignore_source_files`](https://docs.omnipackage.org/configuration/ignore_source_files/index.md) | no       | Patterns for files to exclude from the staged source tree |

## Environment substitution

Any string in `config.yml` can reference an environment variable with `${VAR}`. Values resolve from a `.env` file (project root by default, override with `--env-file <path>`) or from the process environment. Only variables referenced in `config.yml` are consumed.

A `.env` file is the recommended default: every value lives in one place, the same file works for local runs, and it copy-pastes cleanly into a single CI secret. In CI, passing values directly through the runner's environment (per-secret env vars on the step) can be cleaner for per-secret rotation. Both styles work and can be mixed.
