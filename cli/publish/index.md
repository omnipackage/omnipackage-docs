# `omnipackage publish`

Upload already-built packages to a [repository](https://docs.omnipackage.org/configuration/repositories/index.md). Assumes [`omnipackage build`](https://docs.omnipackage.org/cli/build/index.md) ran first **with the same `--build-dir`** — `publish` reads the built `.rpm` / `.deb` / `.pkg.tar.zst` artefacts from there and will not find them if the prior build wrote elsewhere. Use [`omnipackage release`](https://docs.omnipackage.org/cli/release/index.md) for build + publish in one pass without tracking the build dir.

```text
omnipackage publish [project-dir] [flags]
```

`project-dir` defaults to `.`.

## Flags

| Flag                           | Default                        | Description                                                                                                      |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `<project-dir>`                | `.`                            | Project root                                                                                                     |
| `--config-path <rel>`          | `.omnipackage/config.yml`      | Config path relative to the project dir                                                                          |
| `--env-file <path>`            | `.env`                         | Env file for `${...}` substitution in `config.yml`                                                               |
| `--distros <ids...>`           | **all distros in `builds:`**   | Space-separated subset of distros to publish                                                                     |
| `--build-dir <path>`           | `$TMPDIR/omnipackage-build`    | Must match the `--build-dir` of the prior `build`                                                                |
| `--fail-fast`                  | off                            | Stop on the first failing distro                                                                                 |
| `--image-cache <name>`         | none                           | Image cache to use for the repo-metadata generation containers (`createrepo_c`, `dpkg-scanpackages`, `repo-add`) |
| `--repository <name>`          | first entry in `repositories:` | Which `repositories:` entry to publish to                                                                        |
| `--custom-install-page <path>` | built-in template              | Override the generated `install.html` template                                                                   |
| \`--container-output \<stderr  | stdout                         | null>\`                                                                                                          |
| `--disable-container-echo`     | off                            | Disable `set -x` inside the container (less noisy output)                                                        |
| `--fail-log-lines <n>`         | `50`                           | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise          |

## What `publish` does

For each distro:

1. Prunes previously published packages per the repository's [`retain_packages`](https://docs.omnipackage.org/configuration/repositories/#package-retention) setting before uploading.
1. Starts a container with the distro-native repo-metadata tool (`createrepo_c` for RPM, `dpkg-scanpackages` for DEB, `repo-add` for pacman).
1. Adds the built artefact to the repo tree and signs the metadata with the GPG key from `repositories.gpg_private_key_base64`.
1. Uploads the resulting tree to the configured backend (S3-compatible or local filesystem).
1. Renders `install.html` with the four-line install snippet for that distro family and writes it next to the repo.
