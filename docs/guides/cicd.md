# CI/CD integration

Running `omnipackage release` from CI so every push to a release branch (and every tagged release) produces signed packages in your repository.

## GitHub Actions

> Draft — to be refined.

This guide walks through one suggested setup, lifted from a real-world project: [`mpz`](https://github.com/olegantonyan/mpz). Other projects can wire things up differently — different triggers, secret layouts, or job topology — but the shape below is a good starting point. The reference workflows live in [`mpz/.github/workflows`](https://github.com/olegantonyan/mpz/tree/master/.github/workflows), spread across four files:

| File | Trigger | Purpose |
|------|---------|---------|
| `_omnipackage.yml` | `workflow_call` | Reusable release pipeline. |
| `omnipackage-next.yml` | Push to `master` | Rolling **next** channel from every commit. |
| `omnipackage-stable.yml` | GitHub `release` published | **Stable** channel from a tagged release. |
| `refresh-omnipackage-cache.yml` | Monthly cron + manual | Re-primes the container image cache. |

Trigger logic (when to release) is split from pipeline logic (how to release): the two channels share one source of truth and differ in just two inputs — which `repositories:` entry to publish to and which `version_extractor` to use.

### The shared workflow

`_omnipackage.yml` is a reusable workflow with two inputs and two jobs:

{% raw %}
```yaml
on:
  workflow_call:
    inputs:
      repository:
        required: true
        type: string
      version_extractor:
        required: true
        type: string

jobs:
  list-distros:
    runs-on: ubuntu-24.04
    outputs:
      distros: ${{ steps.get-distros.outputs.distros }}
    steps:
      - name: Install omnipackage
        run: |
          echo 'deb https://repositories.omnipackage.org/omnipackage-rs/master/ubuntu_24.04 stable/' | sudo tee /etc/apt/sources.list.d/omnipackage_omnipackage.list
          curl -fsSL https://repositories.omnipackage.org/omnipackage-rs/master/ubuntu_24.04/stable/Release.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/omnipackage_omnipackage.gpg > /dev/null
          sudo apt-get update
          sudo apt-get install omnipackage
      - uses: actions/checkout@v6
      - id: get-distros
        run: echo "distros=$(omnipackage info --list-distros . --format json)" >> "$GITHUB_OUTPUT"

  release:
    needs: [list-distros]
    runs-on: ubuntu-24.04
    concurrency:
      group: omnipackage-${{ inputs.repository }}-${{ matrix.distro }}
      cancel-in-progress: false
    strategy:
      fail-fast: false
      matrix:
        distro: ${{ fromJson(needs.list-distros.outputs.distros) }}
    steps:
      - name: Install omnipackage
        run: |
          echo 'deb https://repositories.omnipackage.org/omnipackage-rs/master/ubuntu_24.04 stable/' | sudo tee /etc/apt/sources.list.d/omnipackage_omnipackage.list
          curl -fsSL https://repositories.omnipackage.org/omnipackage-rs/master/ubuntu_24.04/stable/Release.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/omnipackage_omnipackage.gpg > /dev/null
          sudo apt-get update
          sudo apt-get install omnipackage
      - uses: actions/checkout@v6
      - run: echo "${{ secrets.OMNIPACKAGE_DOTENV }}" > .env
      - run: omnipackage release . --build-dir $RUNNER_TEMP --repository "${{ inputs.repository }}" --distros "${{ matrix.distro }}" --version-extractor "${{ inputs.version_extractor }}" --image-cache github
```
{% endraw %}

Field notes:

- `list-distros` runs `omnipackage info --list-distros . --format json` to emit a JSON array of distro IDs; `fromJson()` then expands it into the `release` matrix. Adding a build target to `config.yml` widens the matrix automatically — no workflow change needed.
- `concurrency.group` is keyed on `(repository, distro)` with `cancel-in-progress: false` so two runs on the same channel queue rather than race. Publishing rewrites the repo metadata (`Release`, `Packages.gz`, `repodata/`); concurrent writers corrupt it.
- `fail-fast: false` lets one distro's failure leave the others' packages published.
- `--image-cache github` references an `image_caches:` entry in `config.yml` — see [Image cache priming](#image-cache-priming) below.

### Stable vs next triggers

Two thin wrappers decide *when* the shared workflow runs and *which channel* it publishes to.

**Next** — `omnipackage-next.yml`. Every push to `master`:

```yaml
name: Release packages - next

on:
  workflow_dispatch:
  push:
    branches: [master]

jobs:
  run:
    uses: ./.github/workflows/_omnipackage.yml
    secrets: inherit
    with:
      repository: "Linux packages - next"
      version_extractor: "git"
```

- `version_extractor: "git"` derives a unique, monotonic version from the commit — every push gets a release without manual bookkeeping.
- `repository: "Linux packages - next"` selects a `repositories:` entry in `config.yml`; that entry's `bucket_public_url` becomes the channel's install-page URL.
- Optionally, swap `push:` for a `workflow_run:` gated on the project's CI workflow if you only want green commits to publish.

**Stable** — `omnipackage-stable.yml`. Only when a GitHub release is cut:

```yaml
name: Release packages - stable

on:
  workflow_dispatch:
  release:
    types: [published]

jobs:
  run:
    uses: ./.github/workflows/_omnipackage.yml
    secrets: inherit
    with:
      repository: "Linux packages - stable"
      version_extractor: "stable"
```

- `release: [published]` fires on a published GitHub release (typically against a `vX.Y.Z` tag); drafts and pre-releases don't trigger.
- `version_extractor: "stable"` reads the version from the GitHub release tag. See [version_extractors](../configuration/version_extractors.md) for the full list.
- Both wrappers also accept `workflow_dispatch` for re-runs after transient failures, without retagging.

`secrets: inherit` propagates repository secrets into the called workflow; without it, `OMNIPACKAGE_DOTENV` is invisible to `_omnipackage.yml`.

### Image cache priming

Without a primed cache, every release rebuilds each per-distro container image from scratch — minutes per distro per run. With a cache, the first step of `build` becomes a registry pull.

`refresh-omnipackage-cache.yml` re-primes monthly and on demand. Same `list-distros` job as above; the second job swaps `release` for `prime`:

{% raw %}
```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '44 6 1 * *'

permissions:
  packages: write

jobs:
  # list-distros: same as _omnipackage.yml

  image_cache:
    needs: [list-distros]
    runs-on: ubuntu-24.04
    strategy:
      fail-fast: false
      matrix:
        distro: ${{ fromJson(needs.list-distros.outputs.distros) }}
    steps:
      - name: Install omnipackage
        run: |
          # same as _omnipackage.yml
      - uses: actions/checkout@v6
      - run: echo "${{ secrets.OMNIPACKAGE_DOTENV }}" > .env
      - run: omnipackage prime . --image-cache github --distros "${{ matrix.distro }}"
```
{% endraw %}

- `permissions: packages: write` lets the workflow's `GITHUB_TOKEN` push images to GHCR (default for modern repos is read-only).
- `cron: '44 6 1 * *'` runs at 06:44 UTC on the 1st of each month. Off-the-hour minutes avoid GitHub's exact-hour scheduler throttling.
- Re-prime when distro base images get security updates, the `setup` script changes, or the toolchain in `setup` moves. Monthly catches the first; the others usually go through `workflow_dispatch` after the relevant change.

The matching `image_caches:` entry:

```yaml
image_caches:
  - name: github
    provider: registry
    image_tag: omnipackage-cache
    registry:
      url: ghcr.io
      namespace: ${GITHUB_REGISTRY_NAMESPACE}
      username: ${GITHUB_REGISTRY_USERNAME}
      password: ${GITHUB_REGISTRY_PASSWORD}
```

The three `GITHUB_REGISTRY_*` env vars come from the `.env` blob (see below).

### Secrets

`OMNIPACKAGE_DOTENV` in the workflow is a convenience, not a requirement. omnipackage reads any `.env` file in the project root, so the same `.env` you use locally for `omnipackage release` runs unmodified in CI — copy-paste its contents into a single multi-line GitHub Actions secret and the workflow writes it back verbatim. One place to rotate, one place to keep in sync between laptop and CI.

The plain GitHub Actions pattern works just as well: one secret per env var, exposed via `env:` on the step. The two approaches can also be mixed — keep the bulk of the `.env` blob and override individual keys per-environment via dedicated secrets.

Either way, `.env` lives in `$GITHUB_WORKSPACE` and is discarded with the runner at job end. It's not uploaded as an artifact, not committed, and not visible to the build container unless `config.yml` explicitly maps it.
