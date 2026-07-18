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

Any string in `config.yml` can reference an environment variable as `${VAR}` (`$VAR` and default values are not recognized). The process environment wins; then `.env`, read from the current directory (override with `--env-file <path>`). A variable defined in neither becomes an empty string. Only variables referenced in `config.yml` are consumed.

A `.env` file is the recommended default: one place for every value, usable both locally and as a single CI secret. In CI you can also pass values directly through the runner's environment, which makes per-secret rotation easier. The two styles mix freely.

For a minimal complete config, see the [`c_makefile` example](https://github.com/omnipackage/examples/blob/master/c_makefile/.omnipackage/config.yml).
