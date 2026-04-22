# `omnipackage gpg`

Generate and convert GPG signing keys. See the [Signing packages](../guides/signing.md) guide for the broader workflow.

## `gpg generate`

Generate a new keypair and print it to stdout.

```
omnipackage gpg generate --name <name> --email <email> --format <pem|base64>
```

| Flag | Description |
|------|-------------|
| `--name` | Key owner name |
| `--email` | Key owner email |
| `--format` | `pem` for ASCII armor, `base64` for base64-wrapped armor (suitable for env vars) |

## `gpg convert`

Convert between key formats.

```
omnipackage gpg convert [--input <file>] --input-format <pem|base64> --output-format <pem|base64>
```

Reads stdin if `--input` is omitted. Always writes to stdout.

<!-- TODO: exporting an existing gpg keyring key into this format -->
