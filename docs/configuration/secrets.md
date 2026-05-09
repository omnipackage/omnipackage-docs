# `secrets`

`secrets:` is a top-level map of name-to-value pairs that need to reach the build but shouldn't appear in `config.yml` itself. Values typically come from `${...}` substitution so the literal secret stays in `.env` or the process environment.

```yaml
secrets:
  API_TOKEN: ${API_TOKEN}
  SENTRY_DSN: ${SENTRY_DSN}
```

A typical use case is a build-time identifier the application needs baked in — Sentry's `SENTRY_DSN` is a common example. It's not catastrophic if leaked, but it shouldn't sit in version control, and the build needs to embed it into the binary or a config file shipped with the package.

## Where secrets are visible

Each entry in `secrets:` reaches the build through three independent paths.

**1. Environment variables inside the build container.** Every entry is passed to the container as `-e NAME=value`, so anything that runs inside the container — `before_build_script`, the spec's `%build` / `%install` scriptlets, `debian/rules` recipes, anything they shell out to — sees them as ordinary env vars (`$API_TOKEN`, `$SENTRY_DSN`).

**2. The Liquid template context.** Secrets are also exposed as a `secrets` object in the template scope:

{% raw %}
```liquid
%post
echo "SENTRY_DSN={{ secrets.SENTRY_DSN }}" >> /etc/my-app/sentry.env
```
{% endraw %}

The substitution happens at render time and the rendered spec / control file is written to disk in the build directory with the literal value embedded. That's fine for ephemeral CI runners, but **don't** template secrets into files that ship inside the package itself — they'd be readable by anyone who downloads it.

**3. As `${...}` substitution targets in `config.yml`.** Strictly speaking this is the same `${}` expansion that any other env-sourced value uses; once a secret is referenced from `config.yml`, it's just a string in the parsed config. The `secrets:` block is only what makes it cross into the container in step 1.

## Log redaction

Every value listed in `secrets:` is fed to the logger as a redaction term. Anything OmniPackage prints — its own progress lines, the captured stdout/stderr from inside the container — runs through a substring replace that swaps each secret value for `[REDACTED]` before output. So if a build script accidentally `echo`s `$API_TOKEN`, the captured line shows up as `[REDACTED]` in the build log.

Two caveats worth knowing:

- **Redaction is plain substring replace, not regex or whole-token.** Very short or non-unique secret values can match unrelated text in the log. Use long, unique values.
- **Redaction only applies to OmniPackage's own log output.** Files written *into* the build (like a rendered spec file containing {% raw %}`{{ secrets.X }}`{% endraw %}) keep the literal value — that's what makes them work. Treat the build directory the same way you'd treat the GPG key on disk.

## What gets logged at startup

The job variables line OmniPackage prints at the top of each build shows only the **keys** of the `secrets:` map, never the values:

```
starting build for fedora_42, variables: version=1.2.3 current_time_rfc2822=... secrets=[API_TOKEN, SENTRY_DSN]
```

Useful for confirming the right secrets are loaded without accidentally splashing them into CI logs.
