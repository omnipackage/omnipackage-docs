# `omnipackage info`

Query project metadata without running a build. Useful in CI scripts — the JSON form of `--list-distros` drives the GitHub Actions matrix in the [CI/CD guide](https://docs.omnipackage.org/guides/cicd/index.md).

```text
omnipackage info [project-dir] [flags]
```

`project-dir` defaults to `.`. One of `--list-distros` or `--show-install-page-url` is required (otherwise nothing is printed).

## Flags

| Flag                      | Default                        | Description                                            |
| ------------------------- | ------------------------------ | ------------------------------------------------------ |
| `<project-dir>`           | `.`                            | Project root                                           |
| `--config-path <rel>`     | `.omnipackage/config.yml`      | Config path relative to the project dir                |
| `--env-file <path>`       | `.env`                         | Env file for `${...}` substitution in `config.yml`     |
| `--list-distros`          | off                            | Print every `distro:` ID from `builds:`                |
| `--show-install-page-url` | off                            | Print the URL where the install page will be published |
| `--repository <name>`     | first entry in `repositories:` | Repository scoping for `--show-install-page-url`       |
| \`--format \<plain        | json>\`                        | `plain`                                                |

## Examples

```sh
# Plain list of distros, one per line
omnipackage info . --list-distros

# JSON array — for CI matrix generation
omnipackage info . --list-distros --format json

# Where the install page will land for the default repository
omnipackage info . --show-install-page-url

# ...for a specific repository
omnipackage info . --show-install-page-url --repository "Linux packages - stable"
```
