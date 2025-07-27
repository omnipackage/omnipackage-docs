# Welcome to OmniPackage

## Architecture overview

There are 2 main components:

1. [Agent]({{ agent_github_url }}) - responsible for building packages. Can be used as stand-alone or as a build agent connected to the server
2. [Server aka web]({{ web_github_url }}) - responsible for web UI, package signing and repositories management. Managed version [{{ web_hosted_url | replace("http://", "")|replace("https://", "") }}]({{ web_hosted_url }}). Can be [self-hosted](self_hosting.md)

Server maintains connection with a bunch of agents and distributes the build tasks to them. Agent build pacakges and upload them to the server. Server signs the packages using GPG and publishes them to the repositories.

Agent can be used as stand-alone application to build packages. Useful for debugging builds locally.
