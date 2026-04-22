# Getting started

## Installing CLI tool

There are multiple ways to install it:

1. [OmniPackage repositories]({{ agent_public_install_url }})
2. [Source code]({{ agent_github_url }}). Reasonably recent version of Rust required

Test your installation
```
omnipackage --version
```

## Build example project

```
git clone git@github.com:omnipackage/examples.git
cd examples/c_makefile
```

Generate a GPG key. This key is required to sign the packages. You can use your existing key.

```
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email 'your@email' --format base64)" >> .env
```

Note that the key is in PEM format encoded in base64. This is needed to be able to pass it as env variable without worrying about escaping new lines.

By default omnipackage expects `.env` file in the root of the project, but it can be overriden by `--env-file` option.

Run `release` command

```
omnipackage release .
```

This will create local repositories at `/tmp/omnipackage-repos`. You can open `/tmp/omnipackage-repos/install.html` in browser and use these repositries locally. Path `/tmp/omnipackage-repos` is defined in `.omnipackage/config.yml` under `repositories`. By default the first entry under `repositories` is used by `release` command.

## Next steps

Local repositories can be useful for testing purposes, but for production you probably need S3. The example s3 config also provided in `.omnipackage/config.yml`. All secrets must be declared in `config.yml` and passed from env via `${...}` syntax. This way `config.yml` remains the only source of truth, while `.env` (or any other env file or actual env) hold secrets. No hidden env settings beyond what's declared in config.
