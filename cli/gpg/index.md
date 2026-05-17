# `omnipackage gpg`

Generate and convert GPG signing keys. See [Signing packages](https://docs.omnipackage.org/guides/signing/index.md) for the broader workflow (export from your existing keyring, passphrase requirements, etc.).

## `gpg generate`

Generate a new keypair and print the **private** key to stdout. The public key is derivable from it on demand, so OmniPackage stores only one.

```text
omnipackage gpg generate --name <name> --email <email> [--format pem|base64]
```

| Flag              | Default      | Description                |
| ----------------- | ------------ | -------------------------- |
| `--name <name>`   | — (required) | Key owner name (real name) |
| `--email <email>` | — (required) | Key owner email            |
| \`--format \<pem  | base64>\`    | `pem`                      |

The generated key is RSA 4096-bit, no expiration, **no passphrase** (OmniPackage cannot use a passphrased key). Generation runs in an isolated `GNUPGHOME` — your real `~/.gnupg` is never touched.

```sh
# Typical: write directly into .env
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email you@example.com --format base64)" >> .env
```

## `gpg convert`

Convert between `pem` and `base64` encodings of the same key.

```text
omnipackage gpg convert [<input>] [--input-format pem|base64] [--output-format pem|base64]
```

| Flag                    | Default   | Description                                                   |
| ----------------------- | --------- | ------------------------------------------------------------- |
| `<input>`               | stdin     | Positional path to the input key file. Reads stdin if omitted |
| \`--input-format \<pem  | base64>\` | `pem`                                                         |
| \`--output-format \<pem | base64>\` | `base64`                                                      |

Always writes to stdout. The conversion is loss-free — decoding the `base64` form yields exactly the original `pem` block.

```sh
# pem (e.g. exported from your gpg keyring) → base64 for .env
omnipackage gpg convert signing-key.asc

# base64 from .env → pem for inspection or re-import
echo "$GPG_KEY" | omnipackage gpg convert --input-format base64 --output-format pem | gpg --import
```
