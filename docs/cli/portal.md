# `omnipackage portal`

Open an interactive shell inside the build container for a given distro. The working directory, dependencies, and env match a real build — this is the debugging tool when a build fails and you want to poke around.

```
omnipackage portal <distro-id> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--build-dir <path>` | Build directory to mount. |

<!-- TODO: what's pre-mounted, how to exit cleanly, differences from a raw docker run -->
