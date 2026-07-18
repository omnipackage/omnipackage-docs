# CLI reference

OmniPackage ships a single binary, `omnipackage`, with several subcommands.

## Commands

| Command                                                        | Purpose                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| [`init`](https://docs.omnipackage.org/cli/init/index.md)       | Scaffold `.omnipackage/` for a new project              |
| [`build`](https://docs.omnipackage.org/cli/build/index.md)     | Build packages inside containers, don't publish         |
| [`publish`](https://docs.omnipackage.org/cli/publish/index.md) | Upload already-built packages to a repository           |
| [`release`](https://docs.omnipackage.org/cli/release/index.md) | `build` and `publish` in one pass per distro            |
| [`prime`](https://docs.omnipackage.org/cli/prime/index.md)     | Pre-populate the image cache                            |
| [`info`](https://docs.omnipackage.org/cli/info/index.md)       | Query project metadata (distros, install-page URL)      |
| [`gpg`](https://docs.omnipackage.org/cli/gpg/index.md)         | Generate and convert signing keys                       |
| [`portal`](https://docs.omnipackage.org/cli/portal/index.md)   | Open an interactive shell in a distro's build container |

## Global options

| Flag                           | Description |
| ------------------------------ | ----------- |
| \`--container-runtime \<docker | podman>\`   |

If neither is set, `podman` is preferred when available, otherwise `docker`. The command fails if neither is in `$PATH`.

## Environment variables

| Variable                        | Effect                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `OMNIPACKAGE_CONTAINER_RUNTIME` | Same as `--container-runtime`; the flag takes precedence if both are set                                                          |
| `OMNIPACKAGE_BUILD_DIR`         | Same as `--build-dir`; the flag takes precedence if both are set. An empty string is treated as unset (falls back to the default) |
| `NO_COLOR`                      | Disable ANSI colors in OmniPackage's own log output                                                                               |

## Common per-command flags

The project flags (`<project-dir>`, `--config-path`, `--env-file`) apply to `build`, `publish`, `release`, `prime`, and `info`. The job flags (the rest of the table) apply to all of them except `info`. Every flag has a default — most invocations only need `<project-dir>`, which itself defaults to the current directory.

| Flag                   | Default                                                          | Description                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `<project-dir>`        | `.` (current dir)                                                | Positional path to the project root                                                                                           |
| `--config-path <rel>`  | `.omnipackage/config.yml`                                        | Config path relative to the project dir                                                                                       |
| `--env-file <path>`    | `.env`                                                           | `.env` file for `${...}` substitution in `config.yml`. Relative paths resolve from the current directory, not `<project-dir>` |
| `--distros <ids...>`   | **all distros configured in `builds:`**                          | Space-separated list of distro IDs to act on                                                                                  |
| `--build-dir <path>`   | `$TMPDIR/omnipackage-build` (typically `/tmp/omnipackage-build`) | Where intermediate build artefacts go; per-distro subdirs live under here. Also settable via `OMNIPACKAGE_BUILD_DIR`          |
| `--fail-fast`          | off (continue with remaining distros on error)                   | Stop on the first failing distro instead                                                                                      |
| `--image-cache <name>` | none (no cache, full setup runs every time)                      | Use a configured [image cache](https://docs.omnipackage.org/configuration/image_caches/index.md) by name                      |

`--distros`, `--image-cache`, `--repository`, and `--version-extractor` also accept their first-letter short forms (`-d`, `-i`, `-r`, `-v`) on every command that takes them.

## Common logging flags

`build`, `publish`, `release`, and `prime` share these. OmniPackage's own progress logs always go to stdout; the flags below control output from the process running **inside** the container. The full container log is always written to disk under `--build-dir` regardless of these settings.

| Flag                          | Default                                     | Description                                                                                                                                        |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| \`--container-output \<stderr | stdout                                      | null>\`                                                                                                                                            |
| `--disable-container-echo`    | off (`set -x` enabled inside the container) | Quieter container output                                                                                                                           |
| `--fail-log-lines <n>`        | `50`                                        | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise (output already went to the terminal live) |
