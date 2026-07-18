---
description: "Generated install files reference — install.html, install.sh, install.json, badge.svg — and the --custom-install-page template contract."
---

# The install page

Every `publish` or `release` writes four files to the repository root, next to the per-distro package trees: `install.html`, `install.sh`, `install.json`, and `badge.svg`. Each publish regenerates them and merges the result with what is already there: the published distro's entry is updated, the others are kept. A multi-distro repo stays complete even when distros are published one at a time, as in a [CI matrix](cicd.md).

`omnipackage info --show-install-page-url` prints the page URL.

## `install.html`

A self-contained static page with install instructions for every published distro, grouped by family. Each entry holds copy-paste shell steps and the repository's GPG public key; the header offers a one-line `curl ... | sh` that runs `install.sh`. Light and dark themes, no external assets.

The page stores its own data as JSON inside a `<script type="application/json" id="data">` element, and the next publish reads existing entries back from it. This is why a [custom template](#custom-install-page) must keep that element.

## `install.sh`

The POSIX installer behind the one-liner. It picks the distro id from `/etc/os-release`, refuses to run on a CPU architecture other than the one the packages were built for, asks for confirmation on a TTY, and needs root (`sudo` when available).

| Flag | Effect |
|------|--------|
| `-y`, `--yes` | Skip the confirmation prompt |
| `--distro <id>` | Skip autodetection, use this distro id |
| `-h`, `--help` | Usage |

## `install.json`

The same data for scripts: a JSON array with one object per distro.

| Field | Meaning |
|-------|---------|
| `distro_id` | Distro id, e.g. `fedora_42` |
| `distro_name` | Human-readable name |
| `distro_family` | Family used for grouping, e.g. Debian, Fedora |
| `install_steps` | Install commands, one array element per shell line |
| `gpg_key` | ASCII-armored public key |
| `download_url` | Repository URL for that distro |
| `package_type` | `rpm`, `deb`, or `pacman` |
| `arch` | `x86_64` or `aarch64` |
| `package_name` | From `config.yml` |
| `timestamp` | RFC 3339 time of that distro's last publish |

## `badge.svg`

A shields-style badge: the repository `name` from `config.yml` on the left, package counts per format on the right. After an S3 publish, ready-to-paste badge markdown is printed in the log.

## Custom install page

`publish` and `release` accept `--custom-install-page <path>`: a [Liquid](https://shopify.github.io/liquid/) template that replaces the built-in page. Two rules:

- Keep a `<script type="application/json" id="data">` element. Publish stores the distro data there and reads it back on the next run; without it, previously published distros drop off the page.
- The template context is `package_name` plus any extra keys on the [repository entry](../configuration/repositories.md): a `homepage: https://myapp.example.com` line on the repository renders as {% raw %}`{{ homepage }}`{% endraw %}.

Start from the built-in [`install.html.liquid`](https://github.com/omnipackage/omnipackage-rs/blob/master/src/publish/repo_files/install.html.liquid).
