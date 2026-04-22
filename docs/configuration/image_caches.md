# `image_caches`

Each build target pulls a container image. Image caches let you push prepared images to a registry (or save them locally) so subsequent builds skip the `setup` step.

## Providers

### `registry`

```yaml
image_caches:
  - name: my-cache
    provider: registry
    image_tag: omnipackage-cache
    registry:
      url: ghcr.io
      namespace: myorg
      username: ${GHCR_USER}
      password: ${GHCR_TOKEN}
```

### `local`

```yaml
image_caches:
  - name: local
    provider: local
    image_tag: omnipackage-cache
```

The cache is populated by the [`prime`](../cli/prime.md) command and consumed by `build` / `publish` / `release` via `--image-cache <name>`.

<!-- TODO: semantics when image is missing — rebuild? fail? -->
