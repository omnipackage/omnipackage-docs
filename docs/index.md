# OmniPackage documentation

Build and distribute signed RPM and DEB packages from your own repository.

OmniPackage is a CLI that drives the standard Linux packaging tools (`rpmbuild`, `debuild`, `createrepo_c`, `dpkg-scanpackages`, `gpg`, `podman`/`docker`) from a single config file, so one project repo can ship to many distros. Developers get one config and one `release` command; users get a generated install page with the usual four-line `apt` / `dnf` / `zypper` snippet. Updates flow through the distro's normal upgrade tools — no separate updater, no extra channel. See [About](https://omnipackage.org/about) for the longer motivation.

## 30-second example

```sh
omnipackage init .
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email you@example.com --format base64)" >> .env
# edit .omnipackage/config.yml — point repositories: at your bucket
omnipackage release .
```

Full walkthrough: [Getting started](getting_started.md).

## Real-world projects

- [`olegantonyan/mpz`](https://github.com/olegantonyan/mpz) — Qt-based desktop music player. 31 build targets, Qt5/Qt6 split via YAML anchors, per-distro CMake flags, R2 with Cloudflare cache purges.
- [`omnipackage/omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs) — OmniPackage built with itself. `before_build_script` to install a current Rust toolchain on older distros, distro-packaged Rust on newer ones, dual GHCR caches for org and contributor-fork workflows.
- [`omnipackage/examples`](https://github.com/omnipackage/examples) — minimal one-per-language templates (C, C++, CMake, Rust, Go, Python, Ruby, Crystal, Electron, Tauri).

See [Examples](examples.md) for details.

## Links

- [omnipackage.org](https://omnipackage.org/) — project landing page
- [GitHub](https://github.com/omnipackage/omnipackage-rs) — source, issues, releases
- [Install OmniPackage](https://repositories.omnipackage.org/omnipackage-rs/stable/install.html) — apt / dnf / zypper one-liners
