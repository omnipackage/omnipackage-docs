# Welcome to OmniPackage

## Architecture overview

There are 2 main components:

1. [Agent]({{ agent_github_url }}) - responsible for building packages. Can be used as stand-alone or as a build agent connected to the server-side
2. [Server-side aka web]({{ web_github_url }}) - responsible for web UI, package signing and repositories management. Managed version [{{ web_hosted_url | replace("http://", "")|replace("https://", "") }}]({{ web_hosted_url }}). Can be [self-hosted](self_hosting.md)
