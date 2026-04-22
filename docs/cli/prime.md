# `omnipackage prime`

Pre-populate the container [image cache](../configuration/image_caches.md) by running the `setup` stage for each distro and snapshotting the result. Later `build` / `release` runs start from the cached image and skip `setup`.

```
omnipackage prime <project-dir> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--distros <ids>` | Subset of distros to prime. |
| `--build-dir <path>` | Build directory. |
| `--fail-fast` | Stop on first failing distro. |
| `--image-cache <name>` | Which image cache to populate. |

Typical use: run `prime` once as a scheduled CI job so interactive releases are fast.

<!-- TODO: cache invalidation — when to re-prime -->
