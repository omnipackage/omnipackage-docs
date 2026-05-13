# `image_caches`

Each build target pulls a container image. Image caches let you push prepared images (the distro base plus everything `setup` installs) to a registry — or store them locally — so subsequent builds start from the snapshot and skip `setup`.

The cache is populated by [`prime`](../cli/prime.md) and consumed by `build` / `publish` / `release` via `--image-cache <name>`. If the named cache is configured but not yet primed, the container runtime fails to pull it — run `prime` first.

## Providers

### `registry`

Push cached images to any OCI-compatible container registry (GHCR, Docker Hub, GitLab Registry, self-hosted Harbor, …).

```yaml
image_caches:
  - name: my-cache
    provider: registry
    image_tag: omnipackage-cache
    registry:
      url: ghcr.io
      namespace: myorg
      username: ${REGISTRY_USER}
      password: ${REGISTRY_TOKEN}
```

The full image reference is `<url>/<namespace>/<image_tag>:<distro_id>`, e.g. `ghcr.io/myorg/omnipackage-cache:fedora_42`.

### `local`

Snapshot the image into the container runtime's local store. No registry, no push — for quick local iteration when you just want to skip `setup` on subsequent runs.

```yaml
image_caches:
  - name: local
    provider: local
    image_tag: omnipackage-cache
```

## GitHub Container Registry (ghcr.io)

GHCR is the most common CI target — free and tightly integrated with GitHub Actions — but also the most common source of credential confusion. Two cases:

### From GitHub Actions: `GITHUB_TOKEN`

Inside a workflow, the auto-injected `GITHUB_TOKEN` can push and pull from GHCR — no PAT needed. The job must declare write access:

```yaml
permissions:
  packages: write
```

(The default for modern repos is read-only — enough to pull but not push; `prime` fails without `write`.) In the workflow step, pass the values into `.env` so they reach `${...}` substitution in `config.yml`:

{% raw %}
```yaml
- run: |
    echo "GITHUB_REGISTRY_USERNAME=${{ github.actor }}" >> .env
    echo "GITHUB_REGISTRY_PASSWORD=${{ secrets.GITHUB_TOKEN }}" >> .env
    echo "GITHUB_REGISTRY_NAMESPACE=${{ github.repository_owner }}" >> .env
```
{% endraw %}

`GITHUB_TOKEN` is ephemeral — scoped to the workflow run, no rotation needed.

### Outside Actions (local dev, other CI): Personal Access Token

`GITHUB_TOKEN` only exists inside a GitHub Actions runner. To `prime` from your laptop or other CI, use a **classic Personal Access Token** with `write:packages` and `read:packages` scopes (fine-grained tokens don't currently cover GHCR — use classic). Create it at GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**, then paste it into your local `.env`:

```sh
GITHUB_REGISTRY_USERNAME=your-github-username
GITHUB_REGISTRY_PASSWORD=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REGISTRY_NAMESPACE=your-github-username   # or an org you have package-write on
```

The same env-var names work in both cases — only the source of the token differs.

### `namespace`: org vs personal

GHCR images are owned by either a GitHub user or an organization. `namespace` is whichever one owns the package:

- Personal repo or personal-account `prime`: `namespace` is your GitHub username ({% raw %}`${{ github.repository_owner }}`{% endraw %} resolves to this in personal-repo workflows).
- Org-owned repo: `namespace` is the org name. The token (`GITHUB_TOKEN` or PAT) needs `packages: write` on the org's packages.

For projects primed from both org-owned CI and contributor forks, declare two `image_caches:` entries — one per namespace — and select with `--image-cache <name>` at run time. [`omnipackage-rs/.omnipackage/config.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) does exactly this with `github` and `github_personal` entries.

## Real-world references

- [`mpz`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml) — single `github` entry, primed monthly from GitHub Actions with `GITHUB_TOKEN`.
- [`omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) — dual `github` / `github_personal` entries for org + contributor-fork workflows.

The matching CI wiring (`refresh-omnipackage-cache.yml`, `permissions: packages: write`, the `.env`-writing step) is in the [CI/CD integration guide](../guides/cicd.md#image-cache-priming).
