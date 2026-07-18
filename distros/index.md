# Supported distros

OmniPackage builds DEB, RPM, and pacman packages for the distributions below. Use the **ID** in `config.yml` (`builds[].distro`) and on the command line (`--distros <id>`).

The authoritative source is [`distros.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/src/distros.yml); run `omnipackage info --list-distros` to print the set your installed version supports.

## DEB-based

| Distribution | IDs                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Debian       | `debian_11`, `debian_12`, `debian_13`, `debian_testing`, `debian_unstable`                     |
| Ubuntu       | `ubuntu_20.04`, `ubuntu_22.04`, `ubuntu_24.04`, `ubuntu_25.04`, `ubuntu_25.10`, `ubuntu_26.04` |

## RPM-based

| Distribution        | IDs                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Fedora              | `fedora_38`, `fedora_39`, `fedora_40`, `fedora_41`, `fedora_42`, `fedora_43`, `fedora_44`, `fedora_rawhide` |
| openSUSE Leap       | `opensuse_15.3`, `opensuse_15.4`, `opensuse_15.5`, `opensuse_15.6`, `opensuse_16.0`                         |
| openSUSE Tumbleweed | `opensuse_tumbleweed`                                                                                       |
| AlmaLinux           | `almalinux_8`, `almalinux_9`, `almalinux_10`                                                                |
| Rocky Linux         | `rockylinux_8`, `rockylinux_9`, `rockylinux_10`                                                             |
| Mageia              | `mageia_9`, `mageia_10`, `mageia_cauldron`                                                                  |

## Pacman-based

| Distribution | IDs       |
| ------------ | --------- |
| Arch Linux   | `arch`    |
| Manjaro      | `manjaro` |

Deprecated IDs

Still recognized, but their base-image repositories no longer work, so builds fail: `debian_10`, `ubuntu_23.04`, `ubuntu_23.10`. Avoid them in new configs.

## Architecture

OmniPackage does not pass `--platform` to the container runtime, so builds run on the host's native architecture: an ARM64 host produces ARM64 binaries with no extra configuration. Most base images are multiarch. Exceptions: Arch Linux is x86_64-only upstream, and Manjaro's ARM repositories are no longer updated.

Repositories are per-architecture. To publish both `aarch64` and `x86_64`, build two separate sets of repos: each on a host of the matching architecture, with its own bucket or path and its own install page.
