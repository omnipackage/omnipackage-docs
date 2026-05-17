---
description: "`omnipackage init` reference — scaffold `.omnipackage/` (config.yml, RPM specfile, Debian control files) for a new project, with defaults picked from autodetected project type and `git config`."
---

# `omnipackage init`

Scaffold `.omnipackage/` for a project that doesn't yet have one. Detects the project type from manifest files (`Cargo.toml`, `go.mod`, `package.json`, …), then writes a starter `config.yml`, an RPM `specfile.spec.liquid`, and the Debian `control` / `changelog` / `compat` / `rules` templates, all pre-filled with package name, maintainer, and version-extractor defaults.

```
omnipackage init [path] [flags]
```

`path` defaults to `.`. Existing files under `.omnipackage/` are preserved unless `--force` is set.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `<path>` | `.` | Project directory that will receive `.omnipackage/` |
| `--type <id>` | autodetected from manifests | Override project type. One of `rust`, `go`, `python`, `ruby`, `crystal`, `c`, `cpp`, `cmake`, `electron`, `tauri`, `generic` |
| `--package-name <name>` | manifest value, else directory basename | Package name; slugified for use in paths |
| `--maintainer <name>` | `git config user.name`, then `$USER`, then `Unknown` | Maintainer name written into changelog and control files |
| `--email <addr>` | `git config user.email`, else `unknown@example.com` | Maintainer email |
| `--homepage <url>` | manifest value, else `https://example.com` | Project homepage |
| `--description <text>` | manifest value, else `<package> packaged with omnipackage` | Short package description |
| `--force` | off | Overwrite existing files in `.omnipackage/` |
| `--dry-run` | off | Print the planned files without writing |

## Project-type detection

`init` walks the project root and picks the first match (most specific first):

| Marker | Type |
|--------|------|
| `src-tauri/Cargo.toml` | `tauri` |
| `Cargo.toml` | `rust` |
| `shard.yml` | `crystal` |
| `go.mod` | `go` |
| `Gemfile` or any `*.gemspec` | `ruby` |
| `package.json` | `electron` |
| `pyproject.toml`, `requirements.txt`, or any `*.py` | `python` |
| `CMakeLists.txt` | `cmake` |
| `*.cpp` / `*.cc` / `*.cxx` | `cpp` |
| `*.c` | `c` |
| anything else | `generic` |

Pass `--type` to override the autodetected value.

## Default version extractor per type

Each scaffolded `config.yml` ships with a `version_extractors:` entry tuned to the project type:

| Type | File | Regex |
|------|------|-------|
| `rust` | `Cargo.toml` | `version = "(.+)"` |
| `tauri` | `src-tauri/Cargo.toml` | `version = "(.+)"` |
| `go` | `version.go` | `Version = "(.+)"` |
| `python` | `main.py` | `VERSION = "(.+)"` |
| `ruby` | `lib/<pkg>/version.rb` | `VERSION = "(.+)"` |
| `crystal` | `shard.yml` | `version: (.+)` |
| `electron` | `package.json` | `"version": "(.+)"` |
| `cmake` | `CMakeLists.txt` | `project\([^)]*VERSION ([0-9.]+)` |
| `c` / `cpp` | `version.h` | `VERSION "(.+)"` |
| `generic` | `VERSION` | `^(\S+)$` |

Edit the resulting `config.yml` if the project keeps its version somewhere else — see [`version_extractors`](../configuration/version_extractors.md).

## What gets written

Under `<path>/.omnipackage/`:

- `config.yml` — one `builds:` entry per distro family, with `setup`, `build`, and `install` blocks pre-filled for the project type.
- `specfile.spec.liquid` — RPM spec template.
- `deb/control.liquid`, `deb/changelog.liquid`, `deb/compat.liquid`, `deb/rules.liquid` — Debian source-package templates.

`--dry-run` prints the same list without writing. Run it first if you're unsure what `init` will touch.

## After running

1. Edit `config.yml` and replace the placeholder `build:` / `install:` commands with the project's real build steps.
2. Generate or point to a GPG key — see [`gpg generate`](gpg.md) and [Signing packages](../guides/signing.md).
3. Fill in a `repositories:` entry — see [`repositories`](../configuration/repositories.md).
4. Run [`omnipackage build`](build.md) to verify the scaffold compiles.
