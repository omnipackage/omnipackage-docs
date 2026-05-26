---
description: "`omnipackage release` reference — build and publish RPM/DEB packages in one pass, the most common command in CI."
---

# `omnipackage release`

Build and publish in one pass per distro. The most common command in CI — most users only run `release`, not the separate `build` / `publish` pair.

```
omnipackage release [project-dir] [flags]
```

`project-dir` defaults to `.`.

`release` is not literally `build` followed by `publish`. For each distro it performs build + repo metadata generation + signing in a single container invocation, then uploads, then renders the install page. That is why `release` does not depend on a prior `--build-dir` (whereas `publish` does).

Previously published packages are pruned per the repository's [`retain_packages`](../configuration/repositories.md#package-retention) setting before the upload.

## Flags

The union of `build` and `publish` flags. Every flag has a default; the table shows the value used if the flag is omitted.

| Flag | Default | Description |
|------|---------|-------------|
| `<project-dir>` | `.` | Project root |
| `--config-path <rel>` | `.omnipackage/config.yml` | Config path relative to the project dir |
| `--env-file <path>` | `.env` | Env file for `${...}` substitution in `config.yml` |
| `--distros <ids...>` | **all distros in `builds:`** | Space-separated subset of distros |
| `--build-dir <path>` | `$TMPDIR/omnipackage-build` | Where per-distro build subdirs live |
| `--fail-fast` | off | Stop on the first failing distro |
| `--image-cache <name>` | none | Use a configured [image cache](../configuration/image_caches.md) |
| `--repository <name>` | first entry in `repositories:` | Which `repositories:` entry to publish to |
| `--version-extractor <name>` | first entry in `version_extractors:` | Pick a [version extractor](../configuration/version_extractors.md) by name |
| `--custom-install-page <path>` | built-in template | Override the generated `install.html` template |
| `--container-output <stderr|stdout|null>` | `stderr` | Where output from the build process running inside the container is **printed to the terminal**. `null` means nothing is printed. OmniPackage's own logs always go to stdout. The full container log is **always** written to disk under `--build-dir` regardless |
| `--disable-container-echo` | off | Disable `set -x` inside the container (less noisy output) |
| `--fail-log-lines <n>` | `50` | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise |

## `release` vs. separate `build` + `publish`

- **`release`** — the default. Everything happens in the same container per distro, so it is also faster than the two-step pair.
- **`build` then `publish`** — useful for inspecting the artefact (install it locally, run a smoke test) before pushing to the repository, or for publishing the same artefact to multiple repositories without rebuilding.
