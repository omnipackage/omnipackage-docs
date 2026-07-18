---
description: Install OmniPackage and build the bundled C example end-to-end — first signed RPM, DEB, and pacman packages from one config.yml.
---

# Getting started

Install the CLI and build the bundled C example end-to-end.

## Install the CLI

Options:

1. OmniPackage repositories — recommended: [x86_64]({{ agent_public_install_url }}) · [aarch64]({{ agent_public_install_aarch64_url }})
2. [AUR](https://aur.archlinux.org/packages/omnipackage) — Arch alternative, e.g. `yay -S omnipackage`
3. [Source]({{ agent_github_url }}) — requires Rust 1.85+ (2024 edition)

Verify:

```
omnipackage --version
```

Expected output: `omnipackage <version>` confirming the binary is on `$PATH`.

## Build the example project

Clone the [examples repo](https://github.com/omnipackage/examples) and enter the C/Makefile sample:

```
git clone https://github.com/omnipackage/examples.git && cd examples/c_makefile
```

Generate a GPG signing key. To reuse an existing one, see [Signing packages](guides/signing.md).

```
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email 'you@example.com' --format base64)" >> .env
```

The key is ASCII-armored, then base64-encoded so it fits in an env variable without newline escaping.

OmniPackage reads `.env` from the project root by default; override with `--env-file`. `.env` now holds your private signing key — keep it out of version control (the examples repo already gitignores it).

Run `release` (`.` is the project directory containing `.omnipackage/config.yml`):

```
omnipackage release .
```

The build log streams for each distro in `.omnipackage/config.yml`.

The command writes local repositories to `~/omnipackage-examples-repos/c_makefile`. Open `~/omnipackage-examples-repos/c_makefile/install.html` in a browser — a generated landing page with copy-paste instructions for each distro. The same directory also holds `install.sh` — run it to detect this machine's distro and install in one step — and `install.json`, the same data machine-readable for automation. The path comes from the `repositories` block in `.omnipackage/config.yml`; the first entry is used by default.

## Next steps

### Switch to S3 for production

Local repositories suit testing; production usually means S3. The example config already includes an S3 block. Select it by name:

```
omnipackage release . --repository "Example bucket"
```

### How secrets flow

Secrets are declared in `config.yml` and passed from the environment via `${...}`. `config.yml` is the single source of truth; `.env` (or any other env file, or the process environment) holds the values. No hidden env settings exist beyond what `config.yml` declares.
