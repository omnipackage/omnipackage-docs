---
description: "`omnipackage portal` reference — open an interactive shell inside the build container to debug failing builds."
---

# `omnipackage portal`

Open an interactive `bash` shell inside the base container image for a given distro. The debugging tool for when a build fails and you want to poke around — try the same `dnf install ...` / `apt-get install ...` lines `setup` would run, see what error comes back, find the right package name, then update `config.yml`.

```
omnipackage portal <distro> [flags]
```

`<distro>` is the distro ID, e.g. `fedora_42` or `debian_13`. See [Supported distros](../distros.md) for the full list.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `<distro>` | — (required) | Distro ID |
| `--build-dir <path>` | `$TMPDIR/omnipackage-build` | Bind-mounted into the container at `/<basename-of-build-dir>` so you can move files between host and container |

## What you get

- The plain distro base image (e.g. `fedora:42`, `debian:trixie`) — **not** the post-`setup` snapshot. `portal` is for diagnosing setup, not skipping it.
- An interactive `bash` shell as root.
- `--build-dir` mounted at `/<basename>` (so `/tmp/omnipackage-build` becomes `/omnipackage-build` inside).
- `--rm` semantics — the container is discarded when you `exit`, no state persists between portal sessions.

Finding the right package name for a `build_dependencies` entry:

```sh
omnipackage portal fedora_42
# inside container:
dnf install -y my-suspect-package
# or
dnf search my-keyword
```
