# `secrets`

`secrets:` is a top-level map of name-to-value pairs that need to reach the build but must not appear in `config.yml`. Values typically come from `${...}` substitution so the literal value stays in `.env` or the process environment.

```yaml
secrets:
  API_TOKEN: ${API_TOKEN}
  SENTRY_DSN: ${SENTRY_DSN}
```

A typical use case is a build-time identifier the application needs baked in — Sentry's `SENTRY_DSN` is a common example. Not catastrophic if leaked, but it should not sit in version control, and the build needs to embed it into the binary or a config file shipped with the package.

## Where secrets are visible

Each entry in `secrets:` reaches the build through three independent paths.

**1. Environment variables inside the build container.** Every entry is passed as `-e NAME=value`, so anything running inside the container — `before_build_script`, spec `%build` / `%install` scriptlets, `debian/rules` recipes, and anything they shell out to — sees them as ordinary env vars (`$API_TOKEN`, `$SENTRY_DSN`).

**2. The Liquid template context.** Secrets are also exposed as a `secrets` object in the template scope:

```liquid
%post
echo "SENTRY_DSN={{ secrets.SENTRY_DSN }}" >> /etc/my-app/sentry.env
```

Substitution happens at render time; the rendered spec / control file is written to disk in the build directory with the literal value embedded. That is fine for ephemeral CI runners, but **do not** template secrets into files that ship inside the package itself — anyone who downloads it can read them.

**3. As `${...}` substitution targets in `config.yml`.** Strictly the same `${}` expansion any other env-sourced value uses; once a secret is referenced from `config.yml`, it is just a string in the parsed config. The `secrets:` block is what makes it cross into the container in step 1.

## Log redaction

Every value listed in `secrets:` is fed to the logger as a redaction term. Anything OmniPackage prints — its own progress lines, captured stdout/stderr from inside the container — runs through a substring replace that swaps each secret value for `[REDACTED]`. If a build script accidentally `echo`s `$API_TOKEN`, the captured line shows up as `[REDACTED]`.

Two caveats:

- **Redaction is plain substring replace, not regex or whole-token.** Short or non-unique secret values can match unrelated text in the log. Use long, unique values.
- **Redaction only applies to OmniPackage's own log output.** Files written *into* the build (a rendered spec containing `{{ secrets.X }}`) keep the literal value — that is what makes them work. Treat the build directory the same way you would treat the GPG key on disk.

## What gets logged at startup

The job variables line at the top of each build shows only the **keys** of the `secrets:` map, never the values:

```text
starting build for fedora_42, variables: version=1.2.3 current_time_rfc2822=... secrets=[API_TOKEN, SENTRY_DSN]
```

Useful for confirming the right secrets are loaded without leaking them into CI logs.
