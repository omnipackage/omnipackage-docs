# OmniPackage documentation

Reference and guides for **OmniPackage**, a CLI for building and publishing signed RPM, DEB, and pacman packages to many Linux distributions from one YAML config. For the project overview and the "why", see [omnipackage.org](https://omnipackage.org/).

## Where to start

- [Getting started](https://docs.omnipackage.org/getting_started/index.md) — install the CLI and ship the bundled C example end-to-end.
- [How it works](https://docs.omnipackage.org/guides/how_it_works/index.md) — what `omnipackage release` does, step by step.
- [Configuration](https://docs.omnipackage.org/configuration/index.md) — every key in `.omnipackage/config.yml`.
- [CLI reference](https://docs.omnipackage.org/cli/index.md) — every subcommand and flag.

## 30-second example

```sh
omnipackage init .
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email you@example.com --format base64)" >> .env
# edit .omnipackage/config.yml — point repositories: at your bucket
omnipackage release .
```

Full walkthrough: [Getting started](https://docs.omnipackage.org/getting_started/index.md).

## Real-world projects

- [`olegantonyan/mpz`](https://github.com/olegantonyan/mpz) — Qt desktop music player. 31 build targets, Qt5/Qt6 split via YAML anchors, per-distro CMake flags, R2 with Cloudflare cache purges.
- [`omnipackage/omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs) — OmniPackage built with itself. `before_build_script` installs a current Rust toolchain on older distros; newer ones use distro-packaged Rust. Dual GHCR caches cover org and contributor-fork workflows.
- [`omnipackage/examples`](https://github.com/omnipackage/examples) — minimal one-per-language templates (C, C++, CMake, Rust, Go, Python, Ruby, Crystal, Electron, Tauri).

See [Examples](https://docs.omnipackage.org/examples/index.md) for details.

## Links

- [omnipackage.org](https://omnipackage.org/) — project landing page
- [GitHub](https://github.com/omnipackage/omnipackage-rs) — source, issues, releases
- [Install OmniPackage](https://repositories.omnipackage.org/omnipackage-rs/stable/install.html) — apt / dnf / zypper / pacman one-liners
