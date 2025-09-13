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

## Building example project locally

1. Clone [examples]({{ examples_url }}) repository
2. `cd examples`
3. `omnipackage build c_makefile`

Now you can install the resulting package. For example, Debian 12:
```shell
sudo dpkg -i /tmp/omnipackage-headless-build/omnipackage-example-c-debian_12/output/omnipackage-example-c_0.0.1-0_amd64.deb
```

## Building and publishing example project to repositories

1. Go to [{{ web_hosted_url | replace("http://", "")|replace("https://", "") }}]({{ web_hosted_url }}) and create a new project
2. Specify sources location - path to Github repo `{{ examples_url }}` and sub-directory - `c_makefile` because the examples repo contains multiple projects in one repo and you want to build only one located in subdir
3. Save, go to project page and click build now
4. After the build and publishing is done you can find instructions how to instll the package on public download page

Now your package is hosted in repositories, signed by a generated GPG key (you can upload your own key), and can be installed using native package managers.
