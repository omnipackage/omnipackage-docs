# Templates

OmniPackage renders `.spec` files (RPM) and `debian/` control files (DEB) from [Liquid](https://shopify.github.io/liquid/) templates. This page explains what variables are available and how to customize per-distro output.

## Scope

- Where templates live: `rpm.spec_template` and `deb.debian_templates` in `config.yml`
- Built-in variables (package name, version, maintainer, description, build/runtime deps)
- Passing arbitrary fields through `config.yml` to the template context
- Per-distro overrides via YAML anchors
- When to write a template vs. rely on the default
- Debugging a template (running `portal` into a container)

<!-- TODO: enumerate exact variable names once confirmed against src/template.rs -->
