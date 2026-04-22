# CLI reference

OmniPackage ships a single binary, `omnipackage`, with several subcommands.

## Commands

| Command | Purpose |
|---------|---------|
| [`build`](build.md) | Build packages inside containers, don't publish |
| [`publish`](publish.md) | Upload already-built packages to a repository |
| [`release`](release.md) | `build` followed by `publish` |
| [`info`](info.md) | Query project metadata (distros, install-page URL) |
| [`gpg`](gpg.md) | Generate and convert signing keys |
| [`portal`](portal.md) | Open an interactive shell in a distro's build container |
| [`prime`](prime.md) | Pre-populate the image cache |

## Global options

| Flag | Description |
|------|-------------|
| `--container-runtime <docker\|podman>` | Override autodetection. Also `OMNIPACKAGE_CONTAINER_RUNTIME`. |
| `--env-file <path>` | Env file to load (default: `.env` in project root). |

<!-- TODO: -->
