# `secrets`

`secrets:` is a map of name-to-value pairs exposed to the build container as environment variables. Values typically come from `${...}` substitution so the literal secret never lives in `config.yml`.

```yaml
secrets:
  API_TOKEN: ${API_TOKEN}
  SIGNING_PASSPHRASE: ${SIGNING_PASSPHRASE}
```

Secrets are visible inside `before_build_script` and during the build itself.

<!-- TODO: how they interact with container logs (are they redacted?) -->
