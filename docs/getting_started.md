# Getting started

## Installing omnipackage CLI

There are multiple ways to install it:

1. OmniPackage repositories [{{agent_public_install_url | replace("http://", "")|replace("https://", "") }}]({{ agent_public_install_url }})
2. [Source code]({{ agent_github_url }}). Reasonably recent version of Rust required.

Test your installation
```shell
omnipackage --version
```

## Building example project locally

1. Clone [examples]({{ examples_github_url }}) repository
2. `cd examples`
3. `omnipackage build c_makefile`

Now you can install the resulting package. For example, Debian 12:
```shell
sudo dpkg -i /tmp/omnipackage-build/omnipackage-example-c-debian_12/output/omnipackage-example-c_0.0.1-0_amd64.deb
```

WIP
