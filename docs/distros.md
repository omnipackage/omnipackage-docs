# Supported distros

OmniPackage can build DEB and RPM packages for the distributions below. Each has a distro ID used in `config.yml` (`builds[].distro`) and on the command line (`--distros <id>`).

<!-- TODO: generate this table from src/distros.yml so it doesn't go stale. Possibly via mkdocs-macros. -->

## DEB-based

| Distro ID | Display name | Package type | Notes |
|-----------|--------------|--------------|-------|
| `debian_11` | Debian 11 | deb | |
| `debian_12` | Debian 12 | deb | |
| `debian_13` | Debian 13 | deb | |
| `debian_testing` | Debian testing | deb | |
| `debian_unstable` | Debian unstable | deb | |
| `ubuntu_20.04` | Ubuntu 20.04 | deb | |
| `ubuntu_22.04` | Ubuntu 22.04 | deb | |
| `ubuntu_24.04` | Ubuntu 24.04 | deb | |
| `ubuntu_25.04` | Ubuntu 25.04 | deb | |
| `ubuntu_25.10` | Ubuntu 25.10 | deb | |
| `ubuntu_26.04` | Ubuntu 26.04 | deb | |
| `debian_10` | Debian 10 | deb | deprecated |
| `ubuntu_23.04` | Ubuntu 23.04 | deb | deprecated |
| `ubuntu_23.10` | Ubuntu 23.10 | deb | deprecated |

## RPM-based

| Distro ID | Display name | Package type | Notes |
|-----------|--------------|--------------|-------|
| `opensuse_15.3` … `opensuse_15.6` | openSUSE Leap 15.x | rpm | |
| `opensuse_16.0` | openSUSE Leap 16.0 | rpm | |
| `opensuse_tumbleweed` | openSUSE Tumbleweed | rpm | |
| `fedora_38` … `fedora_44` | Fedora 38–44 | rpm | |
| `fedora_rawhide` | Fedora Rawhide | rpm | |
| `almalinux_8` / `_9` / `_10` | AlmaLinux | rpm | |
| `rocky_8` / `rocky_9` | Rocky Linux | rpm | |
| `mageia_9` | Mageia 9 | rpm | |
| `mageia_cauldron` | Mageia Cauldron | rpm | |

## Architecture

All distros currently target `x86_64`. ARM/ARM64 is not yet supported.

<!-- TODO: confirm exact distro IDs from src/distros.yml and keep the table generated -->
