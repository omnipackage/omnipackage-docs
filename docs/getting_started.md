# Getting started

OmniPackage turns a source project into signed DEB and RPM repositories. This page walks through installing the CLI and building the bundled C example end-to-end.

## Install the CLI

There are two ways to install it:

1. [OmniPackage repositories]({{ agent_public_install_url }})
2. [Source code]({{ agent_github_url }}) — requires Rust 1.85+ (2024 edition)

Test your installation:
```
omnipackage --version
```

You should see something like `omnipackage 0.1.4`.

## Build the example project

Clone the [examples repo](https://github.com/omnipackage/examples) and enter the C/Makefile sample:

```
git clone https://github.com/omnipackage/examples.git
cd examples/c_makefile
```

Generate a GPG key. This key is required to sign the packages. You can use your existing key.

```
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email 'you@example.com' --format base64)" >> .env
```

The key is ASCII-armored and then base64-encoded so it can live in an env variable without newline escaping.

By default omnipackage expects a `.env` file in the root of the project, but it can be overridden by the `--env-file` option. `.env` now holds your private signing key — keep it out of version control (the examples repo already gitignores it).

Run the `release` command (`.` is the project directory containing `.omnipackage/config.yml`):

```
omnipackage release .
```

You'll see the build log for each distro listed in `.omnipackage/config.yml`.

This will create local repositories at `/tmp/omnipackage-repos`. Open `/tmp/omnipackage-repos/install.html` in a browser — it's a generated landing page with copy-paste instructions for adding the repo on each distro. Path `/tmp/omnipackage-repos` is defined in `.omnipackage/config.yml` under `repositories`, and by default the first entry there is used by the `release` command.

Note that `/tmp` is cleared on reboot on many Linux systems; pick a persistent path in `config.yml` if you want the local repo to survive.

## Next steps

### Switch to S3 for production

Local repositories are fine for testing, but for production you probably want S3. An example S3 block is already provided in `.omnipackage/config.yml` — swap it into the first `repositories:` entry (or reorder the list) and re-run `omnipackage release .`.

### How secrets flow

All secrets must be declared in `config.yml` and passed from env via `${...}` syntax. `config.yml` stays the only source of truth; `.env` (or any other env file, or the actual environment) holds the values. There are no hidden env settings beyond what's declared in config.
