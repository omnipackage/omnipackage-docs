---
description: Overview of the `omnipackage` CLI — build, publish, release, info, gpg, portal, prime subcommands.
---

# CLI reference

OmniPackage ships a single binary, `omnipackage`, with several subcommands.

## Commands

| Command | Purpose |
|---------|---------|
| [`init`](init.md) | Scaffold `.omnipackage/` for a new project |
| [`build`](build.md) | Build packages inside containers, don't publish |
| [`publish`](publish.md) | Upload already-built packages to a repository |
| [`release`](release.md) | `build` and `publish` in one pass per distro |
| [`prime`](prime.md) | Pre-populate the image cache |
| [`info`](info.md) | Query project metadata (distros, install-page URL) |
| [`gpg`](gpg.md) | Generate and convert signing keys |
| [`portal`](portal.md) | Open an interactive shell in a distro's build container |

## Global options

| Flag | Description |
|------|-------------|
| `--container-runtime <docker|podman>` | Override container runtime autodetection. Also settable via `OMNIPACKAGE_CONTAINER_RUNTIME` |

If neither is set, `podman` is preferred when available, otherwise `docker`. The command fails if neither is in `$PATH`.

## Environment variables

| Variable | Effect |
|----------|--------|
| `OMNIPACKAGE_CONTAINER_RUNTIME` | Same as `--container-runtime`; the flag takes precedence if both are set |
| `NO_COLOR` | Disable ANSI colors in OmniPackage's own log output |

## Common per-command flags

Commands that touch the project (`build`, `publish`, `release`, `prime`, `info`) accept the same project- and job-level flags. Every flag has a default — most invocations only need `<project-dir>`, which itself defaults to the current directory.

| Flag | Default | Description |
|------|---------|-------------|
| `<project-dir>` | `.` (current dir) | Positional path to the project root |
| `--config-path <rel>` | `.omnipackage/config.yml` | Config path relative to the project dir |
| `--env-file <path>` | `.env` (in project root) | `.env` file for `${...}` substitution in `config.yml` |
| `--distros <ids...>` | **all distros configured in `builds:`** | Space-separated list of distro IDs to act on |
| `--build-dir <path>` | `$TMPDIR/omnipackage-build` (typically `/tmp/omnipackage-build`) | Where intermediate build artefacts go; per-distro subdirs live under here |
| `--fail-fast` | off (continue with remaining distros on error) | Stop on the first failing distro instead |
| `--image-cache <name>` | none (no cache, full setup runs every time) | Use a configured [image cache](../configuration/image_caches.md) by name |

`--distros`, `--image-cache`, `--repository`, and `--version-extractor` also accept their first-letter short forms (`-d`, `-i`, `-r`, `-v`) on every command that takes them.

## Common logging flags

`build`, `publish`, `release`, and `prime` share these. OmniPackage's own progress logs always go to stdout; the flags below control output from the process running **inside** the container. The full container log is always written to disk under `--build-dir` regardless of these settings.

| Flag | Default | Description |
|------|---------|-------------|
| `--container-output <stderr|stdout|null>` | `stderr` | Where the container's stdout/stderr is **printed to the terminal**. `null` means no terminal output. The default keeps container output on stderr so it doesn't intermingle with OmniPackage's own stdout logs |
| `--disable-container-echo` | off (`set -x` enabled inside the container) | Quieter container output |
| `--fail-log-lines <n>` | `50` | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise (output already went to the terminal live) |
