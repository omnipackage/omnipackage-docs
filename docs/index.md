# OmniPackage documentation

Build and distribute your own RPM and DEB packages — with your own repository.

OmniPackage is a CLI that wraps the Linux packaging tools you'd otherwise drive by hand (`rpmbuild`, `debuild`, `createrepo_c`, `dpkg-scanpackages`, `gpg`, container runtimes) so a single project repo can ship signed packages to many distros from one config file. The result on the developer side is one config and one `release` command; on the user side it's a generated install page with the four-line `apt` / `dnf` / `zypper` snippet they already know how to use. Updates flow through the distro's normal upgrade tools — no extra updater, no separate channel. The longer-form motivation is on [About](https://omnipackage.org/about).

## 30-second example

```sh
omnipackage init .
echo "GPG_KEY=$(omnipackage gpg generate --name 'Your Name' --email you@example.com --format base64)" >> .env
# edit .omnipackage/config.yml — point repositories: at your bucket
omnipackage release .
```

For the full walkthrough, see [Getting started](getting_started.md).

## Real-world projects

- [`olegantonyan/mpz`](https://github.com/olegantonyan/mpz) — Qt-based desktop music player. Large distro matrix (31 builds), Qt5/Qt6 split via YAML anchors, custom CMake flags per distro, R2 + Cloudflare cache purges.
- [`omnipackage/omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs) — OmniPackage building itself. `before_build_script` to install a current Rust toolchain on older distros, distro-packaged Rust on newer ones, dual GHCR caches for org + contributor-fork workflows.
- [`omnipackage/examples`](https://github.com/omnipackage/examples) — minimal one-per-language templates (C, C++, CMake, Rust, Go, Python, Ruby, Crystal, Electron, Tauri).

See [Examples](examples.md) for the longer notes on each.

## Links

- [omnipackage.org](https://omnipackage.org/) — project landing page
- [GitHub](https://github.com/omnipackage/omnipackage-rs) — source code, issues, releases
- [Install OmniPackage](https://repositories.omnipackage.org/omnipackage-rs/stable/install.html) — apt / dnf / zypper one-liners
