# `ignore_source_files`

A list of patterns that exclude files and directories from the source tree before it gets staged into the build container. Applies equally to RPM, DEB, and pacman builds.

```yaml
ignore_source_files:
  - .git
  - .env
  - .DS_Store
  - "*.log"
  - /build
  - /target
  - node_modules
```

## What it does

For each build, OmniPackage uses `rsync` to copy the project source into a working directory inside the container (`/root/rpmbuild/SOURCES/<name>/` for RPM, `/output/build/` for DEB, `/work/<name>/` for pacman). Each pattern in `ignore_source_files` is passed verbatim as `--exclude=<pattern>` to that rsync. Matching files never reach the container, never end up in the source tarball that ships inside the RPM, and never enter the `debuild` working tree.

Two main uses:

- **Keep build artefacts out of the package source.** Prior local builds (`/build`, `/dist`, `/target`, `node_modules`) bloat the staged tree and can confuse the in-container build by colliding with what it is about to produce.
- **Keep secrets out as hygiene.** `.env` typically holds the GPG key, S3 credentials, and other `${...}` sources. The final `.rpm` / `.deb` / `.pkg.tar.zst` only contains files explicitly installed by your spec / `debian/` / `PKGBUILD` recipes, so a stray `.env` in the staged tree will not ship to end users on its own — but it sits in the build container's working tree, available to anything the build script runs. That is a hazard if a script bakes it into a generated config or copies the source tree elsewhere. The init templates exclude `.env` for this reason; do the same when writing a config from scratch.

## Pattern syntax

Patterns are rsync exclude filters (not gitignore — close, but not identical):

| Pattern     | Matches                                                              |
| ----------- | -------------------------------------------------------------------- |
| `name`      | Any file or directory called `name`, at any depth                    |
| `/name`     | A file or directory called `name` only at the source root (anchored) |
| `*.ext`     | Any file with that extension, at any depth (basename glob)           |
| `dir/*.tmp` | `*.tmp` files directly inside any `dir/`                             |

`*` does not cross `/` boundaries (standard rsync). Stick to the four shapes above; more elaborate patterns (`**`, character classes) are valid in rsync but inconsistent across versions, so best avoided for portability.

## Defaults from `omnipackage init`

`omnipackage init` writes a starter `ignore_source_files` matching the detected project type. Common to every type:

```yaml
- .git
- .env
- .DS_Store
- "*.log"
```

Per-type additions:

| Project type        | Adds                            |
| ------------------- | ------------------------------- |
| `rust`              | `/target`                       |
| `cmake`, `cpp`, `c` | `/build`                        |
| `electron`, `tauri` | `node_modules`, `/dist`, `/out` |
| `ruby`              | `/vendor`, `/tmp`               |
| `crystal`           | `/lib`, `/bin`                  |

These are starting points — extend them as the project grows. Real-world examples: [`mpz`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml) excludes `/build`; [`omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) excludes `/target`.
