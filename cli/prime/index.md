# `omnipackage prime`

Pre-populate the container [image cache](https://docs.omnipackage.org/configuration/image_caches/index.md) by running each distro's `setup` stage and snapshotting the result. Subsequent `build` / `release` runs start from the cached image and skip `setup` (the slow `apt-get install build-essential ...` / `dnf install rpmdevtools ...` step).

```text
omnipackage prime [project-dir] [flags]
```

`project-dir` defaults to `.`. Requires `image_caches:` to be configured — without it, `prime` errors out with `image_caches is missing`.

## Flags

| Flag                          | Default                        | Description                                                                                             |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `<project-dir>`               | `.`                            | Project root                                                                                            |
| `--config-path <rel>`         | `.omnipackage/config.yml`      | Config path relative to the project dir                                                                 |
| `--env-file <path>`           | `.env`                         | Env file for `${...}` substitution in `config.yml`                                                      |
| `--distros <ids...>`          | **all distros in `builds:`**   | Space-separated subset to prime                                                                         |
| `--build-dir <path>`          | `$TMPDIR/omnipackage-build`    | Where the per-distro temporary directories live                                                         |
| `--fail-fast`                 | off                            | Stop on the first failing distro                                                                        |
| `--image-cache <name>`        | first entry in `image_caches:` | Which image cache to populate                                                                           |
| \`--container-output \<stderr | stdout                         | null>\`                                                                                                 |
| `--disable-container-echo`    | off                            | Disable `set -x` inside the container (less noisy output)                                               |
| `--fail-log-lines <n>`        | `50`                           | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise |

## What `prime` does, per distro

1. Pulls the distro base image.
1. Runs the distro's `setup` and `setup_repo` commands inside a container, including any `before_build_script` from the build entry.
1. Commits the resulting container as an image tagged `<distro_id>:<image_tag>`.
1. For `provider: registry`, logs in and pushes the image. For `provider: local`, leaves it in the container runtime's local store only.

## When to re-prime

Re-prime when any input to `setup` changes, since the cached image will no longer reflect it:

- The distro's published base image receives security updates (the typical reason for the monthly cron in the [CI/CD guide](https://docs.omnipackage.org/guides/cicd/#image-cache-priming)).
- `build_dependencies` change in `config.yml`.
- A `before_build_script` changes.
- The toolchain installed by `setup` changes (e.g. a newer Rust via `install_rust.sh`).

The first usually runs through the scheduled cron; the rest are triggered manually via `workflow_dispatch` after the relevant change lands.
