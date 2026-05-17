# Signing packages

OmniPackage signs every published `.deb` / `.rpm` and the repository metadata (`Release` / `InRelease` for DEB, `repomd.xml` for RPM) with a GPG private key. End users import the matching public key once when they add the repository; `apt` / `dnf` / `zypper` reject any package or metadata file whose signature does not verify. The key is what makes a published repository trustable.

The key is referenced from `config.yml` as base64-wrapped ASCII armor, normally via `${GPG_KEY}` — substituted from a `.env` file (project root by default, override with `--env-file <path>`) or from the process environment.

```yaml
repositories:
  - name: my-repo
    provider: s3
    gpg_private_key_base64: "${GPG_KEY}"
    # ...
```

The rest of this page covers producing that `GPG_KEY` value — generated fresh, exported from your existing GPG keyring, or converted between formats.

Keep the key secret and back it up

The private key is the trust anchor for your repository. Treat it like any other production secret — never commit it, restrict access, and keep at least one backup somewhere safe (password manager, encrypted offline storage). **If you lose it, you cannot sign updates with the same key.** Signing future releases with a *new* key causes every user's `apt` / `dnf` / `zypper` to reject the updates with a signature-mismatch error; they will have to manually import the new public key (or remove and re-add the repository) before updates resume.

## Generate a new key

```sh
omnipackage gpg generate --name "Your Name" --email you@example.com --format base64
```

This prints a single base64 line to stdout — append it to `.env`:

```sh
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email you@example.com --format base64)" >> .env
```

What the command does:

- Generates an RSA 4096-bit keypair with no expiration date.
- Does **not** set a passphrase — required, since the build runs unattended in CI with no interactive prompt.
- Prints only the private key. The public key is derived from it on every publish, so you do not need to track them separately.
- Runs in a temporary, isolated `GNUPGHOME`; your real `~/.gnupg` is never touched.

The same key signs packages and repo metadata for the lifetime of the repository — rotating it forces every existing user to re-import the new public key, so generate once and keep the `.env` value safe.

## Use an existing key

To reuse an existing GPG key, export it from your keyring and feed it through `omnipackage gpg convert`.

### 1. Find the key ID

```sh
gpg --list-secret-keys --keyid-format=long
```

Note the `sec` line's key ID — the long hex after `rsa<bits>/`.

### 2. Remove the passphrase, if any

OmniPackage cannot use a passphrased key — there is no interactive prompt during a build. Strip the passphrase first:

```sh
gpg --edit-key <KEY_ID>
> passwd
# enter the current passphrase, then leave the new passphrase empty
> save
```

To keep your everyday key passphrased, **do not** do this on it — instead generate a dedicated unprotected signing subkey, or generate a fresh key with `omnipackage gpg generate` (above) and use it exclusively for package signing.

### 3. Export the private key as ASCII armor

```sh
gpg --armor --export-secret-keys <KEY_ID> > signing-key.asc
```

The result is a multi-line `-----BEGIN PGP PRIVATE KEY BLOCK-----` block.

### 4. Convert to base64 and put it in `.env`

```sh
echo "GPG_KEY=$(omnipackage gpg convert --input signing-key.asc --input-format pem --output-format base64)" >> .env
rm signing-key.asc
```

Delete `signing-key.asc` once it is in `.env` — no reason to keep two copies of the secret on disk.

## Convert between formats

`omnipackage gpg convert` round-trips between two key encodings:

| Format   | What it is                                                                  | Where it is used                                                               |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pem`    | Plain ASCII armor (`-----BEGIN PGP PRIVATE KEY BLOCK-----`...). Multi-line. | What `gpg --armor --export-secret-keys` produces; human-inspectable.           |
| `base64` | The PEM block, base64-encoded into one line of ASCII.                       | What `config.yml` expects in `gpg_private_key_base64`; what you put in `.env`. |

Why base64? ASCII-armored PGP keys contain newlines, and newlines do not survive `.env` files, GitHub Actions secrets (the multi-line case works but is fragile), or shell `export VAR=...`. Base64 collapses the whole thing into a single line of `[A-Za-z0-9+/=]`, which round-trips cleanly through every layer between your laptop and the build container.

```sh
# pem → base64 (typical: prepare for .env)
omnipackage gpg convert --input signing-key.asc --input-format pem --output-format base64

# base64 → pem (typical: inspect or re-import)
omnipackage gpg convert --input key.b64 --input-format base64 --output-format pem | gpg --import

# stdin works too
cat signing-key.asc | omnipackage gpg convert --input-format pem --output-format base64
```

The conversion is loss-free — the same bytes in a different envelope. Decoding the base64 form yields exactly the original ASCII-armored block.
