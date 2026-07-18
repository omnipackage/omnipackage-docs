# Getting started

Install the CLI and build the bundled C example end-to-end.

## Install the CLI

Options:

1. OmniPackage repositories — recommended: [x86_64](https://repositories.omnipackage.org/omnipackage-rs/stable/install.html) · [aarch64](https://repositories.omnipackage.org/omnipackage-rs/stable-aarch64/install.html)
1. [AUR](https://aur.archlinux.org/packages/omnipackage) — Arch alternative, e.g. `yay -S omnipackage`
1. [Source](https://github.com/omnipackage/omnipackage-rs/) — requires Rust 1.95+

Verify:

```text
omnipackage --version
```

Prints `omnipackage <version>` if the binary is on `$PATH`.

## Build the example project

Clone the [examples repo](https://github.com/omnipackage/examples) and enter the C/Makefile sample:

```text
git clone https://github.com/omnipackage/examples.git && cd examples/c_makefile
```

Generate a GPG signing key. To reuse an existing one, see [Signing packages](https://docs.omnipackage.org/guides/signing/index.md).

```text
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email 'you@example.com' --format base64)" >> .env
```

The key is ASCII-armored, then base64-encoded so it fits in an env variable without newline escaping.

OmniPackage reads `.env` from the project root by default; override with `--env-file`. `.env` now holds your private signing key — keep it out of version control (the examples repo already gitignores it).

Run `release` (`.` is the project directory containing `.omnipackage/config.yml`):

```text
omnipackage release .
```

The build log streams for each distro in `.omnipackage/config.yml`.

The command writes local repositories to `~/omnipackage-examples-repos/c_makefile`. Open `install.html` there in a browser for copy-paste install instructions per distro. The directory also holds `install.sh`, which detects the machine's distro and installs in one step, and `install.json` with the same data for automation (see [Install page](https://docs.omnipackage.org/guides/install_page/index.md)). The path comes from the `repositories` block in `.omnipackage/config.yml`; the first entry is used by default.

## Next steps

### Switch to S3 for production

Local repositories are for testing; production usually means S3. The example config already includes an S3 block. Select it by name:

```text
omnipackage release . --repository "Example bucket"
```

### How secrets flow

Secrets are declared in `config.yml` and passed from the environment via `${...}`. `config.yml` declares what is needed; `.env` (or any env file, or the process environment) holds the values. There are no hidden env settings.
