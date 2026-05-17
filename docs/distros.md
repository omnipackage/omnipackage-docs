---
description: Linux distributions OmniPackage builds DEB and RPM packages for, with the distro IDs used in config.yml and on the --distros command line.
---

# Supported distros

OmniPackage builds DEB and RPM packages for the distributions listed below. Each entry shows the distro ID used in `config.yml` (`builds[].distro`) and on the command line (`--distros <id>`).

The list is fetched live from [`distros.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/src/distros.yml) and always reflects current support.

## DEB-based

<div id="supported-distros-deb"></div>

## RPM-based

<div id="supported-distros-rpm"></div>

## Architecture

OmniPackage does not pass `--platform` to the container runtime, so builds run on the host's native architecture. All supported base images are multiarch (Mageia is the exception — x86_64 only upstream), so an ARM64 host produces ARM64 binaries without extra configuration.

Repositories are per-architecture. Publishing for both `aarch64` and `x86_64` requires two independent sets of repos — each built on a host of the matching architecture, uploaded to its own bucket or path, and served through its own install page.

<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="../javascripts/distros.js" defer></script>
