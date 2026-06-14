---
description: Fixing OmniPackage build failures — missing dependencies, unpackaged files, link errors, OOM, and per-distro package-name lookup.
---

# Troubleshooting

Every package is built in a clean per-distro container, so problems that never appear in a local build surface here — missing distro packages, private headers, foreign-arch binaries. Match the message in your build log to a fix below. For the build patterns these fixes refer to, see [Build recipes](build_recipes.md).

## Dependencies and packaging

| Symptom in the build log | Cause | Fix |
|---|---|---|
| `Failed to find required Qt component "…Private"` | The project (or a bundled lib) uses Qt private headers; the base `*-devel` package omits them. Often only a warning locally. | Add the private-headers package to `build_dependencies` — see the [Qt6 map](build_recipes.md#qt6-dependencies). |
| `Installed (but unpackaged) file(s) found` (rpm) | `cmake --install` ran a bundled library's own install rules (headers, `.a`, cmake config). | Install only your own [component](build_recipes.md#cmake-and-qt): `cmake --install _build --component myapp`. |
| deb: `missing find_package for IMPORTED target` / fetched targets absent | `dh_auto_configure` forces `-DFETCHCONTENT_FULLY_DISCONNECTED=ON`, blocking CPM/FetchContent. | Drive `cmake` directly in `debian/rules` — see [CMake and Qt](build_recipes.md#cmake-and-qt). |
| `No provider of '<pkg>'` (dnf/zypper) · `Unable to locate package` (apt) | Wrong package name for that distro family. | Look up the real name ([below](#finding-the-right-package-name)) and fix the family anchor. |
| App can't load its own `libfoo.so` at runtime (Fedora/openSUSE/EL/Mageia) | The project hardcodes `install(DESTINATION lib)`; libs land in `/usr/lib`, not the `lib64` loader path. | Relocate `/usr/lib/*` → `%{_libdir}` in the spec — see [CMake and Qt](build_recipes.md#cmake-and-qt). |
| `dpkg-shlibdeps: no dependency information found for …/libfoo.so` | A private or unversioned internal lib has no shlibs entry. | Add `override_dh_shlibdeps:` with `--ignore-missing-info`; rpm needs nothing. See [CMake and Qt](build_recipes.md#cmake-and-qt). |
| Runtime: `<Type> is not a type` · `module "QtQuick.X" is not installed` · blank UI | A dlopened QML module or the SVG plugin isn't a dependency (these aren't auto-detected), or the app uses a private module a newer Qt no longer exposes. | List the module in `runtime_dependencies` (see the [QML map](build_recipes.md#qt6-dependencies)); if it's an app bug, [patch the staged source](build_recipes.md#patching-staged-source). |
| Wrong or empty `version` in the package | The version_extractor regex didn't match. | The regex runs over the whole file — use one capture group and a unique prefix like `project(`. See [version_extractors](../configuration/version_extractors.md). |
| `add_subdirectory … does not contain a CMakeLists.txt`, empty `libs/<sub>` | Git submodules weren't initialized; the working tree is staged verbatim. | `git submodule update --init --recursive` before building (recursive matters for nested submodules). |
| `unzip: not found` (or another tool) mid-build, but local builds are fine | A bundled dep's build step shells out to a helper present on one base image but not another. | Add the tool to `build_dependencies` for every family. |
| Local `cmake`/`make` succeeds but the container build fails | The container lacks packages your machine has (private headers, newer Qt). | Expected — always validate with a real `omnipackage build`, not a local configure. |
| Build host reboots or processes are OOM-killed | Concurrent builds and/or full `--parallel` exhaust RAM (Qt is heavy). | Build one distro at a time locally; keep parallelism for CI. |
| `dpkg: command not found` when inspecting a `.deb` | The build host isn't Debian. | Read the `.deb` with `ar`+`tar` — see [Verifying a built package](build_recipes.md#verifying-a-built-package). |
| `bogus date in %changelog` (rpm) | The weekday doesn't match the date. | Use a real weekday (`date -d 2026-06-01 +%a`). |
| Dependency install 404s on an end-of-life release | Archived base-image repos no longer resolve. | Drop EOL distros from `builds:`. |
| `mageia_cauldron`: metadata 404 on all mirrors | Rolling-repo checksum desync — not your config. | Retry later, or drop `mageia_cauldron`. |

## Electron and Node

| Symptom in the build log | Cause | Fix |
|---|---|---|
| openSUSE TW: `curl`/`wget`/`zypper` → `undefined symbol: ngtcp2_crypto_*` | Listing `curl`/`wget` in `build_dependencies` upgraded `libcurl-mini4` to a skewed `libcurl4`, breaking every libcurl tool (including zypper). | Remove `curl`/`wget` from the openSUSE `build_dependencies`; the base image's curl already works for nvm. |
| rpm: `nothing provides 'libX.so()(64bit)'` (libffmpeg, libnss3, a musl `libc.so`…) | Bundled private libs are needed by **unversioned** soname with no Provides. | Exclude them: `%global __requires_exclude ^.+\\.so\\(\\)\\(64bit\\)$` and prune foreign prebuilts. See [Electron and Node](build_recipes.md#electron-and-node). |
| `__requires_exclude` strips real deps, or has no effect | The spec parser eats one backslash, so a single `\(` matches every soname. | Use **double** backslashes: `\\.so\\(\\)`. |
| `/usr/bin/strip: Unable to recognise the format … arm64.node` | rpm's strip pass hit a foreign-arch prebuilt binary a dep bundles. | `%define __os_install_post %{nil}` (rpm) / empty `override_dh_strip:` (deb); prune foreign prebuilts. |
| `fatal error: source_location: No such file or directory` | A native module needs C++20 `<source_location>` (libstdc++ ≥ gcc 11); the compiler is older. | Add a versioned gcc ≥ 11 and symlink it in `before_build_script`, or drop the distro. |
| `unrecognized command line option '-std=gnu++20'` | The default compiler is older than gcc 10. | Same as above. |

## pacman and Arch

| Symptom in the build log | Cause | Fix |
|---|---|---|
| `undefined symbol: aws_lc_*_SHA512` and other prebuilt C/asm link errors | makepkg enables LTO by default, which can't link prebuilt objects. | Add `options=('!lto')` to the PKGBUILD. |
| `bundle: command not found` in `package()` | Arch's `ruby` ships no bundler executable. | `gem install --user-install --no-document bundler` and add `$(ruby -e 'puts Gem.user_dir')/bin` to `PATH`. |
| Manjaro: `lib*.so.N: cannot open shared object` installing build deps | A bare `pacman -Sy <pkg>` is a partial upgrade against a lagging base image. | Always `pacman -Syu`. OmniPackage's setup already does — this only bites in your own pacman commands. |

## Finding the right package name

When a build aborts at dependency install, the package name is wrong for that family. Open a shell in the plain base image and search:

```sh
omnipackage portal opensuse_tumbleweed   # zypper se -s qt6 | grep -i 5compat
omnipackage portal fedora_42             # dnf provides '*/Qt6GuiPrivateConfig.cmake'
omnipackage portal debian_13             # apt-get update && apt-cache search qt6-.*private
omnipackage portal arch                  # pacman -Ss qt6   (base-devel is preinstalled)
```

!!! note
    Family names diverge in ways that surprise. openSUSE's Core5Compat package is `qt6-qt5compat-devel` (same as Fedora), **not** `qt6-core5compat-devel`.

The full per-family Qt6 list is in [Build recipes → Qt6 dependencies](build_recipes.md#qt6-dependencies).
