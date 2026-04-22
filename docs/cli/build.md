# `omnipackage build`

Build packages for the distros defined in `.omnipackage/config.yml`, without publishing.

```
omnipackage build <project-dir> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--distros <ids>` | Comma-separated subset of distros to build (default: all defined in config). |
| `--build-dir <path>` | Where intermediate build artefacts go (default: `.omnipackage/build`). |
| `--fail-fast` | Stop on the first failing distro instead of building the rest. |
| `--image-cache <name>` | Use a configured [image cache](../configuration/image_caches.md). |
| `--version-extractor <name>` | Pick a [version extractor](../configuration/version_extractors.md) by name. |
| `--container-output` | Stream container output to stdout during the build. |
| `--disable-container-echo` | Suppress container output entirely. |
| `--fail-log-lines <n>` | On failure, print the last N lines of the build log. |

<!-- TODO: exit codes, sample output -->
