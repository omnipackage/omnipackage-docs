# Supported distros

OmniPackage can build DEB and RPM packages for the distributions below. Each has a distro ID used in `config.yml` (`builds[].distro`) and on the command line (`--distros <id>`).

The list is fetched live from [`distros.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/src/distros.yml) in the OmniPackage repo, so it always reflects what is currently supported.

## DEB-based

<div id="supported-distros-deb"></div>

## RPM-based

<div id="supported-distros-rpm"></div>

## Architecture

All distros currently target `x86_64`. ARM/ARM64 is not yet supported.

<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="../javascripts/distros.js" defer></script>
