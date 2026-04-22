# `omnipackage info`

Query project metadata without building anything. Useful in CI scripts.

```
omnipackage info <project-dir> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--list-distros` | Print the distros defined in `config.yml` (JSON or plain text). |
| `--show-install-page-url` | Print the URL where the install page will be published. |
| `--repository <name>` | Scope the query to a specific repository entry. |

<!-- TODO: output format samples -->
