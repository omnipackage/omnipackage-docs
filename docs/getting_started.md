# Getting started

## Installing omnipackage-agent

Agent is responsible for building packages. You'll need it to build packages locally. There are multiple ways to install it:

1. OmniPackage repositories [web.omnipackage.org/oleg/omnipackage-agent](https://web.omnipackage.org/oleg/omnipackage-agent)
2. [Source code](https://github.com/omnipackage/omnipackage-agent-ruby). Reasonably recent version of Ruby required. Executables located in `exe/` directory

Test your installation
```shell
omnipackage --check
```

Agent requires `podman` or `docker` as well as few other common Linux programs. It will check their availability upon start and report if anything is missing.
