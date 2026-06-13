---
description: Run `omnipackage release` from CI — GitHub Actions matrix, image-cache strategies, and the recommended release flow for signed RPM/DEB/pacman pipelines.
---

# CI/CD integration

Running `omnipackage release` from CI so every push, tag, or other trigger produces signed packages.

## GitHub Actions

A suggested setup, adapted from [`mpz`](https://github.com/olegantonyan/mpz). Other projects can wire triggers, secrets, and job topology differently; the shape below is a reasonable starting point. The reference workflows in [`mpz/.github/workflows`](https://github.com/olegantonyan/mpz/tree/master/.github/workflows) are four files:

| File | Trigger | Purpose |
|------|---------|---------|
| `_omnipackage.yml` | `workflow_call` | Reusable release pipeline |
| `omnipackage-next.yml` | Push to `master` | Rolling **next** channel |
| `omnipackage-stable.yml` | GitHub `release` published | **Stable** channel from a tagged release |
| `refresh-omnipackage-cache.yml` | Monthly cron + manual | Re-primes the container image cache |

When-to-release lives in the trigger wrappers; how-to-release lives in the shared workflow. The two channels differ only in which `repositories:` entry they publish to and which `version_extractor` they use.

The split is optional — a sensible default (dev packages on every push to `master`, stable packages on each tagged release), but a single workflow publishing to a single `repositories:` entry works just as well. Drop the wrapper you do not need and call the pipeline directly.

### The shared workflow

`_omnipackage.yml` takes two inputs and runs two jobs:

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

- `list-distros` emits a JSON array of distro IDs that `fromJson()` expands into the `release` matrix. Adding a build target to `config.yml` widens the matrix automatically.
- `concurrency.group` keyed on `(repository, distro)` with `cancel-in-progress: false` queues same-channel runs instead of racing — concurrent writers corrupt repo metadata (`Release`, `Packages.gz`, `repodata/`).
- `fail-fast: false` lets one distro's failure leave the other distros' packages published.
- `--image-cache github` references the `image_caches:` entry below.

### Stable vs next triggers

Two thin wrappers pick *when* and *which channel*.

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

`version_extractor: "git"` derives a unique, monotonic version from the commit. Swap `push:` for `workflow_run:` to publish only from green CI commits.

**Stable** — `omnipackage-stable.yml`. Only when a GitHub release is published:

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

Drafts and pre-releases do not trigger. `version_extractor: "stable"` reads the version from the GitHub release tag — see [version_extractors](../configuration/version_extractors.md) for alternatives. Both wrappers also accept `workflow_dispatch` for re-runs without retagging.

`secrets: inherit` is required — without it, `OMNIPACKAGE_DOTENV` is not visible to the called workflow.

### Image cache priming

Without a primed cache, every release rebuilds each per-distro container from scratch (minutes per distro). With a cache, `build` starts from a registry pull.

`refresh-omnipackage-cache.yml` re-primes monthly and on demand. Same `list-distros` job; the second job swaps `release` for `prime`:

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

- `permissions: packages: write` lets `GITHUB_TOKEN` push images to GHCR (the default is read-only).
- `cron: '44 6 1 * *'` runs 06:44 UTC on the 1st of each month — off-the-hour minutes avoid scheduler throttling.
- Re-prime when distro base images receive security updates, the `setup` script changes, or the toolchain in `setup` moves. The monthly cron catches the first; trigger manually for the others.

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

The three `GITHUB_REGISTRY_*` env vars come from the `.env` blob.

### Secrets

`OMNIPACKAGE_DOTENV` is a convenience: paste the entire local `.env` into one multi-line GitHub Actions secret, write it back verbatim in CI, and rotate in one place. The plain pattern (one secret per env var, exposed via `env:` on the step) works equally well; the two can be mixed.

`.env` lives in `$GITHUB_WORKSPACE`, is discarded with the runner, is not uploaded as an artifact, and is not visible to the build container unless `config.yml` explicitly maps it.
