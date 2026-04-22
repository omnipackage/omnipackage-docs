# How it works

High-level walkthrough of what happens when you run `omnipackage release`. This page is conceptual — it explains the model, not the flags.

## Scope

- The scaffold → build → sign → publish pipeline
- Why builds run inside containers (one per target distro)
- How `.omnipackage/config.yml` maps to build jobs
- How Liquid templates render into `.spec` (RPM) and `debian/` (DEB) files
- Where packages and repository metadata end up
- How users install from the resulting repository (`apt` / `dnf` / `zypper`)

<!-- TODO: prose + a mermaid diagram of the pipeline -->
