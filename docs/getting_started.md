# Getting started

## Installing omnipackage-agent

Agent is responsible for building packages. You'll need it to build packages locally. There are multiple ways to install it:

1. OmniPackage repositories [{{agent_public_install_url | replace("http://", "")|replace("https://", "") }}]({{ agent_public_install_url }})
2. [Source code]({{ agent_github_url }}). Reasonably recent version of Ruby required. Executables located in `exe/` directory

Test your installation
```shell
omnipackage --check
```

Agent requires `podman` or `docker` as well as few other common Linux programs. It will check their availability upon start and report if anything is missing.

## Building example project

1. Clone [examples]({{ examples_url }}) repository
2. `cd examples`
3. `omnipackage build c_makefile`

Now you can install the resulting package. For example, Debian 12:
```shell
sudo dpkg -i /tmp/omnipackage-headless-build/omnipackage-example-c-debian_12/output/omnipackage-example-c_0.0.1-0_amd64.deb
```
