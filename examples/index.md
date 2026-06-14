# Examples

Minimal single-purpose projects live in the [examples repo](https://github.com/omnipackage/examples), one per language/build-system combination: `c_makefile`, `crystal`, `electron`, `go`, `python`, `ruby`, `rust`, `tauri`, `c_with_secrets`. Each ships a ready-to-use `.omnipackage/config.yml` (RPM, DEB, and pacman targets) and a README.

## Real-world projects

Larger configs that exercise more of OmniPackage — many distros, per-distro overrides, GitHub Actions, signing, S3:

### mpz

[`olegantonyan/mpz`](https://github.com/olegantonyan/mpz) — a Qt desktop music player (C++/CMake). The [`.omnipackage/config.yml`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml) demonstrates:

- **35 build targets** across openSUSE, Debian, Ubuntu, Fedora, AlmaLinux, RockyLinux, Mageia, Arch, and Manjaro.
- **Per-distro Qt version split** via YAML anchors (`*debian_qt5` / `*debian_qt6`, `*readhat_qt5` / `*readhat_qt6`). Each anchor sets the right `build_dependencies` and, for Qt5, passes `CMAKE_EXTRA_CLI: "-DUSE_QT5=ON"`.
- **`runtime_dependencies`** for Qt5 multimedia plugins on Debian-family distros.
- **Two `version_extractors`**: a shell extractor producing `2.99~next.<timestamp>.<sha>` for the rolling channel, and a `file` extractor that pulls the stable version from `CMakeLists.txt` via regex.
- **Custom RPM spec** (`mpz.spec.liquid`), **DEB templates directory** (`.omnipackage/deb`), and **pacman `PKGBUILD`** (`.omnipackage/PKGBUILD.liquid`) — Arch/Manjaro build against Qt6 via a shared `*pacman` anchor.
- **Cloudflare R2** with `cloudflare_zone_id` / `cloudflare_api_token` for cache purges after each publish.
- Matching **GitHub Actions workflows** in [`.github/workflows`](https://github.com/olegantonyan/mpz/tree/master/.github/workflows) — the reference setup the [CI/CD guide](https://docs.omnipackage.org/guides/cicd/index.md) walks through.

### omnipackage-rs

[`omnipackage/omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs) — OmniPackage built with itself. The [`.omnipackage/config.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) addresses a different problem: shipping a Rust binary on distros whose packaged toolchain is too old.

- **`before_build_script: .omnipackage/install_rust.sh`** on older distros (Debian 11/12, Ubuntu 20.04, openSUSE Leap, AlmaLinux, RockyLinux) installs a current toolchain via rustup before the build. Newer distros (Fedora 41+, openSUSE Tumbleweed, Arch, Manjaro) skip the script and use distro-packaged `rust` / `cargo`.
- **Cross-format `runtime_dependencies`** — DEB pipe-OR `["podman | docker", "gpg"]` and RPM rich deps `["(podman or docker)", "gpg"]`. pacman `depends` can't express alternatives, so it hard-depends `["gnupg", "podman"]` (docker via `optdepends`). Same intent, different syntax.
- **Per-distro `ENV_EXPORTS`** — Ubuntu 20.04 needs `export CC=gcc-10` because the default compiler is too old for some dependencies.
- **Two `image_caches`** pointing at the same GHCR registry under different namespaces (org vs. personal) — for builds from forks or contributor accounts.
- **`cargotoml` version extractor** reads the version directly from `Cargo.toml`.
- Matching **GitHub Actions workflows** in [`.github/workflows`](https://github.com/omnipackage/omnipackage-rs/tree/master/.github/workflows). The shape mirrors mpz; the difference — an extra `bootstrap-binary` job that builds the binary from source — is specific to OmniPackage building itself.

Either project is a reasonable starting point: copy mpz for many-distro setups with YAML anchors, copy omnipackage-rs for bootstrapping a toolchain inside the build container.
