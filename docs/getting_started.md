---
description: Install OmniPackage and build the bundled C example end-to-end — first signed RPM and DEB packages from one config.yml.
---

# Getting started

This page installs the CLI and builds the bundled C example end-to-end.

## Install the CLI

Two options:

1. [OmniPackage repositories]({{ agent_public_install_url }})
2. [Source]({{ agent_github_url }}) — requires Rust 1.85+ (2024 edition)

Verify:

```
omnipackage --version
```

You should see something like `omnipackage 0.1.4`.

## Build the example project

Clone the [examples repo](https://github.com/omnipackage/examples) and enter the C/Makefile sample:

```
git clone https://github.com/omnipackage/examples.git && cd examples/c_makefile
```

Generate a GPG signing key. You can also reuse an existing key — see [Signing packages](guides/signing.md).

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

The command creates local repositories at `~/omnipackage-examples-repos/c_makefile`. Open `~/omnipackage-examples-repos/c_makefile/install.html` in a browser — a generated landing page with copy-paste instructions for each distro. The path comes from the `repositories` block in `.omnipackage/config.yml`; the first entry is used by default.

## Next steps

### Switch to S3 for production

Local repositories are fine for testing; production usually means S3. The example config already includes an S3 block. Select it by name:

```
omnipackage release . --repository "Example bucket"
```

### How secrets flow

Secrets must be declared in `config.yml` and passed from env via `${...}`. `config.yml` is the single source of truth; `.env` (or any other env file, or the process environment) holds the values. There are no hidden env settings beyond what's declared in config.
