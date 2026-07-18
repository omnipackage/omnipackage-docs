# The install page

`publish` and `release` write four files to the repository root, next to the per-distro package trees: `install.html`, `install.sh`, `install.json`, and `badge.svg`. Each publish updates the published distro's entry and keeps the rest, so the files stay complete when distros are published one at a time, as in a [CI matrix](https://docs.omnipackage.org/guides/cicd/index.md).

`omnipackage info --show-install-page-url` prints the page URL (S3 repositories).

## `install.html`

A self-contained static page with install instructions for every published distro, grouped by family. Each entry holds copy-paste shell steps and the repository's GPG public key; the header offers a one-line `curl ... | sh` that runs `install.sh`. Light and dark themes, no external assets.

The page stores its data as JSON in a `<script type="application/json" id="data">` element; the next publish reads existing entries from it. A [custom template](#custom-install-page) must keep that element.

## `install.sh`

The POSIX installer behind the one-liner. It picks the distro id from `/etc/os-release`, refuses to run on a different CPU architecture than the packages were built for, asks for confirmation, and needs root (`sudo` when available).

| Flag            | Effect                                 |
| --------------- | -------------------------------------- |
| `-y`, `--yes`   | Skip the confirmation prompt           |
| `--distro <id>` | Skip autodetection, use this distro id |
| `-h`, `--help`  | Usage                                  |

## `install.json`

The same data for scripts: a JSON array with one object per distro.

| Field           | Meaning                                            |
| --------------- | -------------------------------------------------- |
| `distro_id`     | Distro id, e.g. `fedora_42`                        |
| `distro_name`   | Human-readable name                                |
| `distro_family` | Family used for grouping, e.g. Debian, Fedora      |
| `install_steps` | Install commands, one array element per shell line |
| `gpg_key`       | ASCII-armored public key                           |
| `download_url`  | Direct URL of the distro's latest package file     |
| `package_type`  | `rpm`, `deb`, or `pacman`                          |
| `arch`          | `x86_64` or `aarch64`                              |
| `package_name`  | From `config.yml`                                  |
| `timestamp`     | RFC 3339 time of that distro's last publish        |

## `badge.svg`

A shields-style badge: the repository `name` from `config.yml` on the left, distro counts per package format on the right (e.g. `12 RPM 8 DEB`). After an S3 publish, ready-to-paste badge markdown is printed in the log.

## Custom install page

`publish` and `release` accept `--custom-install-page <path>`: a [Liquid](https://shopify.github.io/liquid/) template that replaces the built-in page. Two rules:

- Keep a `<script type="application/json" id="data">` element. Publish stores the distro data there and reads it back on the next run; without it, previously published distros drop off the page.
- The template context is `package_name` plus any extra keys on the [repository entry](https://docs.omnipackage.org/configuration/repositories/index.md): a `homepage: https://myapp.example.com` line on the repository renders as `{{ homepage }}`.

Start from the built-in [`install.html.liquid`](https://github.com/omnipackage/omnipackage-rs/blob/master/src/publish/repo_files/install.html.liquid).
