# How it works

A high-level walkthrough of what happens during `omnipackage release`. This page is conceptual — it explains the model, not the flags.

## What it is

OmniPackage is a thin wrapper over existing Linux packaging infrastructure. `rpmbuild`, `debuild`, `makepkg`, `createrepo_c`, `dpkg-scanpackages`, `repo-add`, `gpg`, container runtimes (`podman` / `docker`), `apt` / `dnf` / `zypper` / `pacman` — none of it is reinvented. OmniPackage drives these tools in the right order, per distro, with sensible defaults, so one project repo can ship signed packages to many distros from one config file.

The motivation is on [About](https://omnipackage.org/about): native Linux packaging works well for distro maintainers, but it is a steep climb for individual developers who want their users to `apt install` their software. OmniPackage closes that gap on both sides — developer UX (one config, one command) and user UX (a generated install page with four copy-paste commands).

## Two flows, one pipeline

There's a developer-side flow and a user-side flow. The pipeline produces both.

```
flowchart TD
  src["source repo"] -->|init| cfg["omnipackage config"]
  cfg -->|release| build["per-distro container build"]
  build -->|sign| pkg["signed package"]
  pkg -->|publish| repo["signed repo on S3"]
  repo --> page["generated install page"]
  page --> install["users install"]
```

### Developer side

1. **Scaffold** *(optional)* — `omnipackage init` detects the project type from marker files (`Cargo.toml`, `go.mod`, `CMakeLists.txt`, `pyproject.toml`, …) and renders a starter `.omnipackage/config.yml` plus per-format template files (RPM `.spec.liquid`, `debian/` directory, pacman `PKGBUILD.liquid`). Detection and the generated templates are best-effort starting points, not finished configs — expect to edit `config.yml`, the spec, and the `debian/` files to match what your project builds and ships. Skip this step entirely if you would rather hand-write the config from one of the [examples](https://docs.omnipackage.org/examples/index.md).

1. **Release** — `omnipackage release` reads the config and, for each configured distro:

   - Pulls the distro container image (`opensuse/leap:16.0`, `fedora:42`, `debian:trixie`, `archlinux:latest`, etc.).
   - Runs the distro's own setup commands inside the container — `zypper install ...`, `apt-get install build-essential debhelper ...`, `dnf install rpmdevtools ...`, `pacman -Syu base-devel ...`. These are not OmniPackage code; they are verbatim distro-native shell commands.
   - Renders the `.spec` (RPM), `debian/` (DEB), or `PKGBUILD` (pacman) templates with project and distro variables via Liquid, then invokes the distro's native build tool (`rpmbuild`, `debuild`, `makepkg`).
   - Signs the resulting `.rpm` / `.deb` / `.pkg.tar.zst` with the configured GPG key. The same key signs packages and repo metadata.
   - Builds repo metadata with the distro-native tool — `createrepo_c` for RPM, `dpkg-scanpackages` for DEB, `repo-add` for pacman.
   - Uploads the signed packages and metadata to S3 (or any S3-compatible store: R2, GCS, B2, MinIO; see [`s3_repository`](https://docs.omnipackage.org/guides/s3_repository/index.md)).
   - Generates an `install.html` landing page with the copy-paste commands users need.

`omnipackage prime` sits orthogonally to this — it pre-runs the distro setup commands and snapshots the resulting container image to a registry, so subsequent releases skip the slow `apt-get install build-essential` phase. See [`image_caches`](https://docs.omnipackage.org/configuration/image_caches/index.md).

`omnipackage` runs anywhere a container runtime does (laptop, VPS, any CI). One common setup is free end-to-end: GitHub Actions covers the build on the free tier for public repositories, and S3-compatible storage is either cheap (AWS) or free under common limits — Cloudflare R2, Backblaze B2, and Google Cloud Storage all have free tiers generous enough for small-to-mid projects.

### User side

What ends up at `<bucket_public_url>/<path_in_bucket>/install.html` is what a real end user sees:

- For DEB-family distros, four lines: add the apt source, import the GPG key, `apt-get update`, `apt-get install <package>`.
- For RPM-family distros, the equivalent `dnf` / `zypper` flow.
- For pacman distros (Arch, Manjaro), import the key with `pacman-key`, add the repo `Server` to `/etc/pacman.conf`, then `pacman -Sy <package>`.

After install, users receive updates through their distro's normal `apt upgrade` / `dnf upgrade` / `zypper update` / `pacman -Syu`. No opt-in updater, no Electron tray icon, no separate channel. The repo is a normal signed repo served over HTTPS.

## What it does not do

- Build other package formats. RPM, DEB, and pacman only. Flatpak/Snap/AppImage/Nix are different bets — see [About](https://omnipackage.org/about) for why. (OmniPackage builds pacman packages into its own signed repo; it does not publish to the AUR.)
- Host your repository. You bring the bucket. The trade-off: no vendor lock-in, and your packages live in storage you control.
- Sandbox installed software. Packages run with the same privileges any `apt install` package gets — no Flatpak-style isolation unless you ship it as part of your package (an AppArmor / SELinux profile, a `bwrap` / `firejail` wrapper around your binary).
