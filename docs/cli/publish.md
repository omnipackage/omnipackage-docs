# `omnipackage publish`

Upload already-built packages to a [repository](../configuration/repositories.md). Assumes `omnipackage build` ran first.

```
omnipackage publish <project-dir> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--distros <ids>` | Comma-separated subset of distros to publish. |
| `--build-dir <path>` | Where to read built artefacts from. |
| `--fail-fast` | Stop on the first failing distro. |
| `--image-cache <name>` | Image cache to use for repo-metadata generation containers. |
| `--repository <name>` | Pick a repository by name (default: first entry in config). |
| `--custom-install-page <path>` | Path to a custom `install.html` template. |
| `--container-output` | Stream container output to stdout. |
| `--disable-container-echo` | Suppress container output. |

<!-- TODO: -->
