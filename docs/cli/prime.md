# `omnipackage prime`

Pre-populate the container [image cache](../configuration/image_caches.md) by running each distro's `setup` stage and snapshotting the result. Later `build` / `release` runs start from the cached image and skip `setup` (the slow `apt-get install build-essential ...` / `dnf install rpmdevtools ...` step).

```
omnipackage prime [project-dir] [flags]
```

`project-dir` defaults to `.`. Requires `image_caches:` to be configured — without it, `prime` errors out with `image_caches is missing`.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `<project-dir>` | `.` | Project root |
| `--config-path <rel>` | `.omnipackage/config.yml` | Config path relative to the project dir |
| `--env-file <path>` | `.env` | Env file for `${...}` substitution in `config.yml` |
| `--distros <ids...>` | **all distros in `builds:`** | Space-separated subset to prime |
| `--build-dir <path>` | `$TMPDIR/omnipackage-build` | Where the per-distro temporary directories live |
| `--fail-fast` | off | Stop on the first failing distro |
| `--image-cache <name>` | first entry in `image_caches:` | Which image cache to populate |
| `--container-output <stderr|stdout|null>` | `stderr` | Where output from the prime process running inside the container is **printed to the terminal**. `null` means nothing is printed. OmniPackage's own logs always go to stdout. The full container log is **always** written to disk under `--build-dir` regardless |
| `--disable-container-echo` | off | Disable `set -x` inside the container (less noisy output) |
| `--fail-log-lines <n>` | `50` | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise |

## What `prime` does, per distro

1. Pulls the distro base image.
2. Runs the distro's `setup` and `setup_repo` commands inside a container, including any `before_build_script` from the build entry.
3. Commits the resulting container as an image tagged `<image_tag>:<distro_id>`.
4. For `provider: registry`, logs into the registry and pushes the image. For `provider: local`, leaves it in the container runtime's local store only.

## When to re-prime

Re-prime when any input to `setup` changes, since the cached image won't reflect it:

- The distro's published base image gets security updates (the most common reason for the monthly cron in the [CI/CD guide](../guides/cicd.md#image-cache-priming)).
- `build_dependencies` change in `config.yml`.
- A `before_build_script` changes.
- The toolchain installed by `setup` moves (e.g. a newer Rust via `install_rust.sh`).

The first usually goes through the scheduled cron; the rest are typically triggered manually via `workflow_dispatch` after the relevant change lands.
