# `omnipackage publish`

Upload already-built packages to a [repository](../configuration/repositories.md). Assumes `omnipackage build` ran first **with the same `--build-dir`** — `publish` reads the built `.rpm` / `.deb` artefacts from that directory and won't find anything if the prior build wrote elsewhere. Use [`omnipackage release`](release.md) if you'd rather do build + publish in one shot without managing the build dir.

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
