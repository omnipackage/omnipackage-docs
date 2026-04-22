# Signing packages

How OmniPackage signs packages and repository metadata with GPG, and how to manage keys across environments.

## Scope

- Why signing matters for DEB and RPM repositories
- Generating a key with `omnipackage gpg generate`
- Using an existing GPG key (converting with `omnipackage gpg convert`)
- Key formats: ASCII armor vs. base64-wrapped armor
- Passing the key through `.env` / `${GPG_KEY}` substitution in `config.yml`
- What gets signed (DEB `Release` / `InRelease`, RPM packages and repo metadata)
- Rotating keys

<!-- TODO: -->
