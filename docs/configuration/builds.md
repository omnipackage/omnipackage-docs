# `builds`

Each entry in `builds:` defines one package build for one target distro. A project that ships to Debian 12 and Fedora 40 has two `builds` entries (often deduplicated with YAML anchors).

## Keys per build entry

| Key | Required | Description |
|-----|----------|-------------|
| `distro` | yes | Distro ID — see [Supported distros](../distros.md) |
| `package_name` | yes | Name used in the built package |
| `maintainer` | yes | `Name <email>` string |
| `homepage` | yes | Project URL |
| `description` | yes | Short package description |
| `build_dependencies` | no | List of distro package names needed to build |
| `runtime_dependencies` | no | List of distro package names needed at runtime |
| `before_build_script` | no | Path to a shell script run before the build |
| `rpm.spec_template` | no | Path to a `.spec.liquid` override (RPM only) |
| `deb.debian_templates` | no | Path to a directory of `debian/*.liquid` overrides (DEB only) |
| *(custom fields)* | no | Arbitrary key/value pairs passed into template context |

## DRYing up with YAML anchors

<!-- TODO: short example showing one anchor reused across 6 distros -->
