# Best practices

Conventions that make OmniPackage-built packages behave well on the distros they target. None of these are enforced by the tool — they're guidance from real-world packaging.

## One repo, then it just works

The user-facing contract: **a user adds your OmniPackage repository and nothing else — and `apt install <your-package>` / `dnf install <your-package>` resolves cleanly, every runtime dependency satisfied from repositories the distro ships with.** No extra PPAs, no Copr, no third-party repos, no manual `.deb` downloads for a transitive dependency.

That contract is what keeps the generated `install.html` page a four-line snippet instead of a small howto. The rest of this page is downstream of holding that line.

## One project per repository

Host a single project per OmniPackage repository. The generated install flow assumes it, and the user experience falls apart otherwise.

`install.html` ends in `apt install <your-package>` — one package, no ambiguity. Stacking unrelated projects into the same bucket breaks that in one of two ways:

- **Non-overlapping audiences.** Users who add your repo see package names they don't recognise. Every `apt search` hit becomes "what's this, and why is it on my system?" — the trust signal of a focused repo is gone.
- **Overlapping audiences.** Users installing more than one of your projects hit a duplicate-source warning unless the install page for project B detects that project A's repo is already configured and skips the add step. Doing that portably across `apt` / `dnf` / `zypper` is extra shell logic the install snippet doesn't currently carry.

The install page itself is one-project-shaped, too — it names a single package in the final command, and making it work for "add this repo, then pick from the list" is workable but tricky enough that it isn't supported today. This may change in a future release; until then, one bucket per project. Buckets and prefixes are cheap (see [`s3_repository`](s3_repository.md)), so the developer-side cost is low.

The occasional pushback is user-side: some people don't love having multiple third-party repos on their system. Fair, but the users who object on those grounds typically wouldn't accept *one* third-party repo either — the trust decision is per-source, not per-package, and the system-side cost of three small focused repos isn't meaningfully different from one large one.

## Runtime dependencies must be in the distro's standard repos

Every package in `runtime_dependencies` — and every shared library your binary links at run time — must resolve from the distro's default repositories: `main`/`universe` on Debian and Ubuntu, the default repos on Fedora, openSUSE, AlmaLinux, Rocky, etc. Those are the repositories every install of the distro already has configured.

That's mostly a positive thing. A dependency on `libssl` or `qt6-base` resolves instantly, picks up security updates through the user's normal `apt upgrade` / `dnf upgrade`, and adds nothing to your package's disk footprint.

Two consequences:

- **Pick library versions that are available across your distro matrix.** If you list `qt6` on a distro that only ships `qt5`, the package won't install. The fix is either narrowing the supported distros, or carrying a per-distro variant via [per-distro custom variables](templates.md#custom-per-distro-variables); [`mpz`](https://github.com/olegantonyan/mpz) builds Qt5 on older distros and Qt6 on newer ones. Distro lifetimes filter further — no point working around a version that only exists on an EOL release.
- **Don't bundle what the distro already ships.** Vendoring a copy of `libcurl` or `zlib` — when the distro has a perfectly good one — wastes space, freezes you on whatever version you bundled, and means a CVE in that library doesn't get patched until *you* cut a new release.

## When a dependency isn't available, static-link it

OmniPackage isn't a distro. You publish your own repository, maintain only your own packages, and nobody downstream is recompiling against your shared libraries. That changes the rules.

Distro packaging policies (Debian Policy, Fedora Packaging Guidelines, openSUSE's, …) generally forbid bundled or statically-linked third-party libraries and require everything to link against system shared libs. That rule exists because the distro maintains the entire dependency graph: one `libfoo` security update is supposed to flow to every consumer at once. Bundled copies break that guarantee.

You don't ship into that graph. So the rule relaxes from a requirement to a recommendation: **prefer shared libraries when the distro has them; static-link when it doesn't.**

Where static linkage is the right call:

- **Library missing from one distro in your matrix.** Dropping Debian 12 from support because it doesn't ship a recent enough `libfmt` is a worse trade than statically linking `libfmt` into the one Debian 12 build. Everywhere else still uses the system shared library.
- **Library too old on one distro.** Same shape — your code needs `libfoo >= 11`, but Ubuntu 22.04 has `libfoo 9`. Static-link on Ubuntu 22.04 (and only there); use the shared `libfoo` everywhere else. See [`mpz`](https://github.com/olegantonyan/mpz) for the same pattern applied to Qt5/Qt6 build flags.
- **Languages that static-link by default.** Rust and Go produce static binaries against their own crates and packages as a matter of course. That's idiomatic and not something to fight — only `libc` and a small set of system libs typically remain dynamic, and those *should* stay dynamic so they pick up distro security updates.

In practice this is a small, focused exception, not a blanket policy. Most of your dependency list still points at distro-shipped packages; one or two libraries are static-linked on the specific distros that need it. If you find yourself static-linking *most* dependencies on *most* distros, that's worth a second look — usually the distro matrix is wrong, or the library choice is.

## `before_build_script` is for build-time tooling, not runtime deps

When a distro's compiler or toolchain is too old, use [`before_build_script`](../configuration/builds.md): a shell script that runs inside the build container before the package build, typically to install a newer toolchain. Pulling a current Rust via `rustup`, installing a recent Node via `nvm`, dropping in a newer CMake from upstream — all fine. [`omnipackage-rs`](https://github.com/omnipackage/omnipackage-rs) does this on older distros and uses distro-packaged Rust on newer ones.

The key distinction: `before_build_script` provisions the **build environment**, not the **user's machine**. Anything it installs is thrown away with the container after the build. The produced `.deb` / `.rpm` must still satisfy the rule above — every runtime dependency must come from the distro's standard repositories.

So: use `before_build_script` freely for a modern toolchain. Don't use it to paper over a runtime dependency you can't satisfy — that produces a package that builds and installs but fails to launch, because the build-time `libfoo` isn't on the user's machine. If a runtime library isn't in the distro's standard repos, static-link it (above) instead.

## Test the installed package, not just the build

`omnipackage release` succeeding means the package built and the repository signed cleanly. It doesn't mean the package *installs and runs* on a fresh system. Build hosts have headers, build tools, and prior dependency installations that production user machines don't. A package that depends on a `-devel` / `-dev` package by mistake, or that links a `before_build_script`-installed library, will build fine and fail on `apt install` (or at first launch) for the first user who tries it.

[`omnipackage portal`](../cli/portal.md) gives you exactly the right environment: an interactive root shell in the plain distro base image, no `setup` applied, container thrown away on `exit`. Open one per distro, add your published repo, `apt install <your-package>` (or `dnf install` / `zypper install`), then run the binary — the snippet from your generated `install.html` is what to paste. Do this at least once per distro before announcing a release.
