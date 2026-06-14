# `omnipackage build`

Build packages for the distros defined in `.omnipackage/config.yml` without publishing. A successful run produces `.rpm` / `.deb` / `.pkg.tar.zst` files under `--build-dir`, ready for [`publish`](https://docs.omnipackage.org/cli/publish/index.md).

```text
omnipackage build [project-dir] [flags]
```

`project-dir` defaults to `.` — `omnipackage build` from the project root is a complete invocation.

## Flags

Every flag has a default; the table shows the value used if the flag is omitted.

| Flag                          | Default                              | Description                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<project-dir>`               | `.`                                  | Project root                                                                                                                                                                                             |
| `--config-path <rel>`         | `.omnipackage/config.yml`            | Config path relative to the project dir                                                                                                                                                                  |
| `--env-file <path>`           | `.env`                               | Env file for `${...}` substitution in `config.yml`                                                                                                                                                       |
| `--distros <ids...>`          | **all distros in `builds:`**         | Space-separated subset of distro IDs                                                                                                                                                                     |
| `--build-dir <path>`          | `$TMPDIR/omnipackage-build`          | Where per-distro build subdirs live                                                                                                                                                                      |
| `--fail-fast`                 | off                                  | Stop on the first failing distro                                                                                                                                                                         |
| `--image-cache <name>`        | none                                 | Use a configured [image cache](https://docs.omnipackage.org/configuration/image_caches/index.md). Requires the cache to be primed first — see [`prime`](https://docs.omnipackage.org/cli/prime/index.md) |
| `--version-extractor <name>`  | first entry in `version_extractors:` | Pick a [version extractor](https://docs.omnipackage.org/configuration/version_extractors/index.md) by name                                                                                               |
| \`--container-output \<stderr | stdout                               | null>\`                                                                                                                                                                                                  |
| `--disable-container-echo`    | off                                  | Disable `set -x` inside the container (less noisy output)                                                                                                                                                |
| `--fail-log-lines <n>`        | `50`                                 | On failure with `--container-output=null`, print the last N lines of the on-disk log. Ignored otherwise — output already went to the terminal live                                                       |

## Notes

- The build matrix is `--distros` (or all configured distros, if omitted) intersected with `builds:`. Each entry runs in its own container; one distro's failure does not affect the others unless `--fail-fast` is set.
- Pass the same `--build-dir` to a follow-up [`publish`](https://docs.omnipackage.org/cli/publish/index.md) — `publish` reads the built artefacts from there.
