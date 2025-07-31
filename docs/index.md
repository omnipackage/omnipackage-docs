# Welcome to OmniPackage

## Architecture overview

There are 2 main components:

1. [Agent]({{ agent_github_url }}) - responsible for building packages. Can be used as stand-alone or as a build agent connected to the server
2. [Server aka web]({{ web_github_url }}) - responsible for web UI, package signing and repositories management. Managed version [{{ web_hosted_url | replace("http://", "")|replace("https://", "") }}]({{ web_hosted_url }}). Can be [self-hosted](self_hosting.md)

Server maintains connection with a bunch of agents and distributes the build tasks to them. Agent build packages and upload them to the server. Server signs the packages using GPG and publishes them to the repositories hosted on S3-compatible storage.

Agent can be used as stand-alone application to build packages. Useful for debugging builds locally. You can host your own agents when using managed server. You can also configure own S3 storage for repositories. Or you can avoid server-side completely and use agent just for local builds without repositories.

## Workflow

Typical steps to build any project:

1. `omnipackage init .` in the project's root directory. This will create `.omnipackage/` directory with necessary files
2. Edit these files for your needs and make `omnipackage build .` work, i.e. produce packages for all specified in `.omnipackage/config.yml` distros
3. Test these packages on all distros

At this point you have working packages that can be used directly if you ignore signature verification errors when installing them. This happens because package managers on Linux verify signature of the package before installation. But packages built with agent locally don't have this signature.

Go a step further:

4. Create a project on [{{ web_hosted_url | replace("http://", "")|replace("https://", "") }}]({{ web_hosted_url }}) or your self-hosted server
5. Trigger build manually or configure Github webhook to trigger it automatically
6. Share "Public install page" with users - this page contains instructions how to add repository and install the package on all supported distros

Packages in the repositories will be signed using auto-generated GPG key. You can download this key for backup on the account page. Or you can upload your own GPG key.