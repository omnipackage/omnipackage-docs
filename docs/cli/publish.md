---
description: "`omnipackage publish` reference — upload already-built RPM, DEB, and pacman packages to a configured repository."
---

# `omnipackage publish`

Upload already-built packages to a [repository](../configuration/repositories.md). Run [`omnipackage build`](build.md) first **with the same `--build-dir`**: `publish` reads the built `.rpm` / `.deb` / `.pkg.tar.zst` artefacts from there. Use [`omnipackage release`](release.md) for build + publish in one pass without tracking the build dir.

```
omnipackage publish [project-dir] [flags]
```

`project-dir` defaults to `.`.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `<project-dir>` | `.` | Project root |
| `--config-path <rel>` | `.omnipackage/config.yml` | Config path relative to the project dir |
| `--env-file <path>` | `.env` | Env file for `${...}` substitution in `config.yml` |
| `--distros <ids...>` | **all distros in `builds:`** | Space-separated subset of distros to publish |
| `--build-dir <path>` | `$TMPDIR/omnipackage-build` | Must match the `--build-dir` of the prior `build` |
| `--fail-fast` | off | Stop on the first failing distro |
| `--image-cache <name>` | none | Image cache to use for the repo-metadata generation containers (`createrepo_c`, `dpkg-scanpackages`, `repo-add`) |
| `--repository <name>` | first entry in `repositories:` | Which `repositories:` entry to publish to |
| `--custom-install-page <path>` | built-in template | Override the generated `install.html` template |
| `--container-output <stderr|stdout|null>` | `stderr` | Where output from the process running inside the container is **printed to the terminal**. `null` means nothing is printed. OmniPackage's own logs always go to stdout. The full container log is **always** written to disk under `--build-dir` regardless |
| `--disable-container-echo` | off | Disable `set -x` inside the container (less noisy output) |
| `--fail-log-lines <n>` | `50` | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise |

## What `publish` does

For each distro:

1. Prunes previously published packages per the repository's [`retain_packages`](../configuration/repositories.md#package-retention) setting before uploading.
2. Starts a container with the distro-native repo-metadata tool (`createrepo_c` for RPM, `dpkg-scanpackages` for DEB, `repo-add` for pacman).
3. Adds the built artefact to the repo tree and signs the metadata with the GPG key from `repositories.gpg_private_key_base64`.
4. Uploads the resulting tree to the configured backend (S3-compatible or local filesystem).
5. Renders `install.html` with the four-line install snippet for that distro family and writes it next to the repo.
