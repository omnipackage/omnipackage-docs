# `image_caches`

Each build target pulls a container image. Image caches let you push prepared images (the distro base image plus everything `setup` installs) to a registry — or save them locally — so subsequent builds skip the slow setup step and start from a snapshot.

The cache is populated by the [`prime`](../cli/prime.md) command and consumed by `build` / `publish` / `release` via `--image-cache <name>`. If the named cache is set up but the image hasn't been primed yet, the underlying container runtime will fail to pull it — `prime` first, `build` after.

## Providers

### `registry`

Push the cached images to any OCI-compatible container registry — GHCR, Docker Hub, GitLab Registry, a self-hosted Harbor, etc.

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

The full image reference becomes `<url>/<namespace>/<image_tag>:<distro_id>`, e.g. `ghcr.io/myorg/omnipackage-cache:fedora_42`.

### `local`

Snapshot the image into the container runtime's local image store. No registry, no push — useful for quick local iteration where you just want to skip setup on subsequent runs.

```yaml
image_caches:
  - name: local
    provider: local
    image_tag: omnipackage-cache
```

## Using GitHub Container Registry (ghcr.io)

GHCR is the most common target in CI because it's free and tightly integrated with GitHub Actions, but it also has the most surface area for credential confusion. Two cases:

### From GitHub Actions: `GITHUB_TOKEN`

Inside a workflow, the auto-injected `GITHUB_TOKEN` can push and pull from GHCR — no PAT needed. The job has to declare write access:

```yaml
permissions:
  packages: write
```

(The default for modern repos is read-only, which is enough to *pull* but not to *push* — `prime` will fail without `write`.) In the workflow step, pass the values into the `.env` so they reach `${...}` substitution in `config.yml`:

{% raw %}
```yaml
- run: |
    echo "GITHUB_REGISTRY_USERNAME=${{ github.actor }}" >> .env
    echo "GITHUB_REGISTRY_PASSWORD=${{ secrets.GITHUB_TOKEN }}" >> .env
    echo "GITHUB_REGISTRY_NAMESPACE=${{ github.repository_owner }}" >> .env
```
{% endraw %}

`GITHUB_TOKEN` is ephemeral — scoped to that workflow run, no rotation, nothing to manage.

### Outside Actions (local dev, other CI): Personal Access Token

`GITHUB_TOKEN` only exists inside a GitHub Actions runner. To `prime` from your laptop or any other CI, you need a **classic Personal Access Token** with the `write:packages` and `read:packages` scopes (fine-grained tokens don't currently cover GHCR — use classic). Create it at GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**, paste it into your local `.env`:

```sh
GITHUB_REGISTRY_USERNAME=your-github-username
GITHUB_REGISTRY_PASSWORD=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REGISTRY_NAMESPACE=your-github-username   # or an org you have package-write on
```

Same env-var names work in both cases — only the source of the token differs.

### `namespace`: org vs personal

GHCR images are owned by either a GitHub user or a GitHub organization. The `namespace` field is whichever one owns the package:

- For a personal repo or a personal-account `prime` run, `namespace` is your GitHub username ({% raw %}`${{ github.repository_owner }}`{% endraw %} resolves to this in personal-repo workflows).
- For an org-owned repo, `namespace` is the org name. The token (whether `GITHUB_TOKEN` or a PAT) needs `packages: write` against that org's packages.

A useful pattern for projects that get primed from both org-owned CI and contributor forks is to declare two separate `image_caches:` entries — one for the org namespace, one for the personal namespace — and pick which to use via `--image-cache <name>` at run time. [`omnipackage-rs/.omnipackage/config.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) does exactly this with a `github` and a `github_personal` entry.

## Real-world references

- [`mpz`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml) — single `github` entry, primed monthly from GitHub Actions using `GITHUB_TOKEN`.
- [`omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) — dual `github` / `github_personal` entries for org + contributor-fork workflows.

The matching CI wiring (`refresh-omnipackage-cache.yml`, `permissions: packages: write`, the `.env`-writing step) is documented in the [CI/CD integration guide](../guides/cicd.md#image-cache-priming).
