# Examples

Minimal, single-purpose projects live in the [examples repo]({{ examples_github_url }}) — one per language/build-system combo (`c_makefile`, `crystal`, `electron`, `go`, `python`, `ruby`, `rust`, `tauri`, `c_with_secrets`). Each has a ready-to-use `.omnipackage/config.yml` and a README.

## Real-world projects

For larger configs that exercise more of OmniPackage end-to-end — many distros, per-distro overrides, GitHub Actions wiring, signing, and S3 publishing — two projects are useful to read in full:

### mpz

[`olegantonyan/mpz`](https://github.com/olegantonyan/mpz) — a Qt-based desktop music player (C++/CMake). The [`.omnipackage/config.yml`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml) is the larger of the two and shows:

- **31 build targets** across openSUSE, Debian, Ubuntu, Fedora, AlmaLinux, RockyLinux, and Mageia.
- **Per-distro Qt version split** via YAML anchors — `*debian_qt5` / `*debian_qt6`, `*readhat_qt5` / `*readhat_qt6`, etc. Each anchor sets the appropriate `build_dependencies` list and (for Qt5) passes `CMAKE_EXTRA_CLI: "-DUSE_QT5=ON"`.
- **`runtime_dependencies`** for Qt5 multimedia plugins on Debian-family distros.
- **Two `version_extractors`**: a shell extractor producing `2.99~next.<timestamp>.<sha>` for the rolling channel, and a `file` extractor that pulls the stable version from `CMakeLists.txt` via regex.
- **Custom RPM spec** (`mpz.spec.liquid`) and **DEB templates folder** (`.omnipackage/deb`).
- **Cloudflare R2** repository with `cloudflare_zone_id` / `cloudflare_api_token` for cache purges after each publish.
- Matching **GitHub Actions workflows** in [`.github/workflows`](https://github.com/olegantonyan/mpz/tree/master/.github/workflows) — the reference setup the [CI/CD guide](guides/cicd.md) walks through.

### omnipackage-rs

[`omnipackage/omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs) — OmniPackage building itself. The [`.omnipackage/config.yml`](https://github.com/omnipackage/omnipackage-rs/blob/master/.omnipackage/config.yml) is a useful counterpoint to mpz because it solves a different problem: shipping a Rust binary across distros where the packaged Rust toolchain is too old.

- **`before_build_script: .omnipackage/install_rust.sh`** on older distros (Debian 11/12, Ubuntu 20.04, openSUSE Leap, AlmaLinux, RockyLinux, etc.) — pulls a current toolchain via rustup before the build runs. Newer distros (Fedora 41+, openSUSE Tumbleweed) skip the script and use distro-packaged `rust` / `cargo`.
- **Cross-format `runtime_dependencies`** — DEB-style `["podman | docker", "gpg"]` and RPM rich deps `["(podman or docker)", "gpg"]`. Same intent, different syntax per package format.
- **Per-distro `ENV_EXPORTS`** — Ubuntu 20.04 needs `export CC=gcc-10` because the default compiler is too old for some dependencies.
- **Two `image_caches`** entries pointing at the same GHCR registry under different namespaces (org vs. personal) — useful when builds run from forks or contributor accounts.
- **`cargotoml` version extractor** reading the version straight from `Cargo.toml`.
- Matching **GitHub Actions workflows** in [`.github/workflows`](https://github.com/omnipackage/omnipackage-rs/tree/master/.github/workflows). The shape is the same as mpz; the differences (an extra `bootstrap-binary` job that builds the binary from source) are specific to the project being omnipackage itself.

Either project is a fair starting point to copy from — pick mpz if you have many distros and want the YAML-anchor pattern, pick omnipackage-rs if you need to bootstrap a toolchain inside the build container.
