---
description: "`omnipackage build` reference — build RPM and DEB packages for the distros in config.yml without publishing."
---

# `omnipackage build`

Build packages for the distros defined in `.omnipackage/config.yml` without publishing. A successful run produces `.rpm` / `.deb` files under `--build-dir`, ready to be picked up by [`publish`](publish.md).

```
omnipackage build [project-dir] [flags]
```

`project-dir` defaults to `.` — `omnipackage build` from the project root is a complete invocation.

## Flags

Every flag has a default; the table shows what you get if you omit it.

| Flag | Default | Description |
|------|---------|-------------|
| `<project-dir>` | `.` | Project root |
| `--config-path <rel>` | `.omnipackage/config.yml` | Config path relative to the project dir |
| `--env-file <path>` | `.env` | Env file for `${...}` substitution in `config.yml` |
| `--distros <ids...>` | **all distros in `builds:`** | Space-separated subset of distro IDs |
| `--build-dir <path>` | `$TMPDIR/omnipackage-build` | Where per-distro build subdirs live |
| `--fail-fast` | off | Stop on the first failing distro |
| `--image-cache <name>` | none | Use a configured [image cache](../configuration/image_caches.md). Requires the cache to be primed first — see [`prime`](prime.md) |
| `--version-extractor <name>` | first entry in `version_extractors:` | Pick a [version extractor](../configuration/version_extractors.md) by name |
| `--container-output <stderr|stdout|null>` | `stderr` | Where output from the build process running inside the container is **printed to the terminal**. `null` means nothing is printed. OmniPackage's own progress logs always go to stdout, so the default keeps the two streams cleanly separated. The full container log is **always** written to a file under `--build-dir` regardless of this setting |
| `--disable-container-echo` | off | Disable `set -x` inside the container (less noisy output) |
| `--fail-log-lines <n>` | `50` | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise — output already went to the terminal live |

## Notes

- The build matrix is `--distros` (or all configured distros if omitted) intersected with `builds:`. Each entry runs in its own container; one distro's failure doesn't poison the others (unless `--fail-fast`).
- Pass the same `--build-dir` to a follow-up [`publish`](publish.md) — `publish` reads the built artefacts from there.
