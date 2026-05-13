# `version_extractors`

A version extractor produces the version string stamped into the built package. At least one is required. `release` and `build` select one with `--version-extractor <name>`.

## Providers

### `file`

Reads a file and applies a regex to extract the version.

```yaml
version_extractors:
  - name: version_file
    provider: file
    file:
      file: VERSION
      regex: '^(.+)$'
```

### `shell`

Runs a shell command; stdout (trimmed) is the version.

```yaml
version_extractors:
  - name: git_tag
    provider: shell
    shell:
      command: "git describe --tags --abbrev=0"
```

### `constant`

Hardcoded version string.

```yaml
version_extractors:
  - name: fixed
    provider: constant
    constant:
      version: "1.0.0"
```

<!-- TODO: notes on error handling when a regex doesn't match / command fails -->
