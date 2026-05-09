# `builds`

Each entry in `builds:` defines one package build for one target distro. A project that ships to Debian 12 and Fedora 40 has two `builds` entries — almost always deduplicated with YAML anchors so the shared bits live in one place.

## Keys per build entry

| Key | Required | Description |
|-----|----------|-------------|
| `distro` | yes | Distro ID — see [Supported distros](../distros.md). Unknown IDs are silently skipped at build time |
| `package_name` | yes | Name of the resulting `.rpm` / `.deb` |
| `maintainer` | yes | `Name <email>` — used in the spec/control `Maintainer:` field and changelog entries |
| `homepage` | yes | Project URL — written into the spec `URL:` and DEB `Homepage:` fields |
| `description` | yes | Short package description |
| `build_dependencies` | no | List of distro package names installed in the container before the build. **Names differ per distro family** (`qt6-base-dev` on Debian, `qt6-qtbase-devel` on Fedora) — the main reason for per-family anchors |
| `runtime_dependencies` | no | List of distro package names declared as runtime deps. Most projects need few or none; see below |
| `before_build_script` | no | Path (relative to source dir) to a shell script run inside the container before the package build, e.g. to install a toolchain that isn't in the distro repos |
| `rpm.spec_template` | RPM only | Path (relative to source dir) to a `.spec.liquid` file. Required for RPM-format distros |
| `deb.debian_templates` | DEB only | Path (relative to source dir) to a directory of `debian/*.liquid` files. Required for DEB-format distros |
| *(custom fields)* | no | Arbitrary scalar values (string, bool, int, float — not arrays or objects) passed straight into the template context. See [Templates](../guides/templates.md#custom-per-distro-variables) |

`rpm:` and `deb:` blocks aren't a per-build override of a default — only the block matching the distro's package format is consulted, so each build entry needs the one for its format. Both are usually defined once via a YAML anchor (see below) rather than repeated.

Unknown top-level keys in `config.yml` are silently ignored, which is what makes the anchor pattern below work cleanly.

### When `runtime_dependencies` is actually needed

For most projects the answer is "rarely". Both `rpmbuild` and `dpkg-shlibdeps` scan the built binaries' linked libraries during the package build and add the providing distro packages as dependencies automatically — so the resulting package already declares everything it dynamically links against. You usually don't need to repeat those in `runtime_dependencies`.

The cases where explicit entries do matter:

- **`dlopen`-loaded libraries** — not present in `DT_NEEDED`, so the build-time scanner can't see them. Anything loaded by name at runtime (plugins, optional codecs, GPU backends) has to be listed.
- **Non-library runtime requirements** — external tools the package shells out to (`gpg`, `ffmpeg`, `podman`), data-only packages, fonts, themes.
- **Choice between alternatives** — when more than one distro package can satisfy the same need (e.g. a tool that shells out to either `podman` or `docker`), the alternation has to be declared explicitly. See the syntax note below.

### `runtime_dependencies` syntax

Each entry is a plain distro package name like `gpg` or `libqt5multimedia5-plugins` — that's all most projects need. Strings pass through verbatim into the rendered spec / control file, so use whatever syntax the target distro's package format understands.

OR-alternative forms — DEB pipe-OR (`pkg | other-pkg`) and RPM rich-dep syntax (`(pkg or other-pkg)`) — are **only** needed when more than one distro package can genuinely satisfy the same need. They are not a general-purpose syntax — if a single distro package provides what you want, write its name as a plain string and move on.

```yaml
# Typical case: plain package names
runtime_dependencies: [gpg, ffmpeg]

# Alternation: only when either provider is acceptable
runtime_dependencies: ["podman | docker", gpg]              # DEB target
runtime_dependencies: ["(podman or docker)", gpg]           # RPM target
```

## DRYing up with YAML anchors

Without anchors, a project shipping to ten distros would repeat the same `package_name`, `maintainer`, `homepage`, `description`, and template paths ten times. With anchors, each build entry shrinks to one or two lines.

A typical layout has three layers: **common** (shared across every build), **per-format** (RPM vs DEB plus their template paths), and **per-distro-family** (where dependency lists actually differ):

```yaml
common: &common
  package_name: my-app
  maintainer: "You <you@example.com>"
  homepage: https://example.com
  description: A short description

rpm: &rpm
  <<: *common
  rpm:
    spec_template: ".omnipackage/my-app.spec.liquid"

deb: &deb
  <<: *common
  deb:
    debian_templates: ".omnipackage/deb"

debian_family: &debian_family
  build_dependencies: [build-essential, cmake]
  <<: *deb

fedora_family: &fedora_family
  build_dependencies: [gcc, make, cmake]
  <<: *rpm

builds:
  - distro: "debian_12"
    <<: *debian_family
  - distro: "debian_13"
    <<: *debian_family
  - distro: "ubuntu_24.04"
    <<: *debian_family
  - distro: "fedora_42"
    <<: *fedora_family
  - distro: "almalinux_9"
    <<: *fedora_family
```

Notes on the syntax:

- `&name` defines an anchor; `*name` references it.
- `<<:` is YAML's merge key — it copies every key from the referenced mapping into the current one. Keys defined explicitly on the entry override merged values.
- Anchors chain transitively: `*debian_family` already merged `*deb`, which already merged `*common`, so each `builds` entry inherits everything up the chain.
- The top-level keys `common:`, `rpm:`, `deb:`, `debian_family:`, `fedora_family:` aren't OmniPackage config — they're YAML scratch space whose only purpose is to host anchors. The parser ignores them and only reads `version_extractors:`, `builds:`, `repositories:`, `image_caches:`, `secrets:`, `ignore_source_files:`.
- Per-distro entries can still override anything — set a different `build_dependencies` list for one distro, add a `before_build_script` only on older distros, etc. Explicit keys win over merged ones.

For a real two-format project that exercises this pattern at scale (Qt5 vs. Qt6 splits, per-distro CMake flags), see [`mpz/.omnipackage/config.yml`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml). For a project that uses `before_build_script` on older distros and skips it on newer ones, see [`omnipackage-rs/.omnipackage/config.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml).

## Custom fields

Anything you put on a build entry beyond the keys above lands in the [template context](../guides/templates.md#custom-per-distro-variables) under the same name. This is the mechanism for per-distro variation that doesn't fit into `build_dependencies` or `runtime_dependencies` — CMake flags, environment exports, feature toggles. Values must be scalars (strings, bools, ints, floats); arrays and nested objects on custom fields are not supported.

```yaml
- distro: "ubuntu_20.04"
  build_dependencies: [curl, make, gcc-10]
  ENV_EXPORTS: "export CC=gcc-10"
  before_build_script: ".omnipackage/install_rust.sh"
  <<: *deb
```

{% raw %}`{{ ENV_EXPORTS }}`{% endraw %} then expands inside the spec or `debian/rules` template to set up the right toolchain before invoking the build. Distros that don't set `ENV_EXPORTS` get an empty string in its place, so the same template works everywhere without {% raw %}`{% if %}`{% endraw %} guards.
