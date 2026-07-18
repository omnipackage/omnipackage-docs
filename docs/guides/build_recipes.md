---
description: Build patterns for tricky projects — CMake/Qt, Electron, pacman — plus the Qt6 dependency map, source patching, and package verification.
---

# Build recipes

OmniPackage builds each package in a clean per-distro container. Most projects need only `build_dependencies` filled in (see [builds](../configuration/builds.md)); the patterns below cover the cases that need more — Qt/CMake quirks, Electron apps, and Arch. To match a specific error message to a fix, see [Troubleshooting](troubleshooting.md).

{% raw %}

## CMake and Qt

- **Make install rules unconditional.** If a project gates its `install()` rules behind an AppImage/qmake flag, lift them into an always-on `if(UNIX AND NOT APPLE)` block so packaging works without that flag. Install the binary, `.desktop` file, icons, and the AppStream `metainfo` (upstream often forgets the last one).

- **Exclude bundled-library artifacts with a component.** Bundled deps (e.g. Qt-Advanced-Docking-System) ship their own `install()` rules — headers, a static lib, cmake config — which land in the buildroot and trigger rpm's *"Installed (but unpackaged) files"* error. Tag your own rules and install only that component:

    ```sh
    # rpm  %install
    DESTDIR=%{buildroot} cmake --install _build --component myapp
    # debian/rules
    DESTDIR=$(CURDIR)/debian/<pkg> cmake --install _build --component myapp
    ```

- **On deb, drive `cmake` directly — not `dh_auto_configure`.** `dh_auto_configure` forces `-DFETCHCONTENT_FULLY_DISCONNECTED=ON`, which blocks CPM/FetchContent from downloading bundled deps, so the fetched targets never exist and `target_link_libraries` fails. Drive cmake yourself in `debian/rules` (recipes are **TAB**-indented):

    ```makefile
    %:
    	dh $@
    override_dh_auto_configure:
    	cmake -S . -B _build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr
    override_dh_auto_build:
    	cmake --build _build --parallel
    override_dh_auto_test:
    override_dh_auto_install:
    	DESTDIR=$(CURDIR)/debian/{{ package_name }} cmake --install _build --component myapp
    ```

- **Initialize submodules first.** OmniPackage stages the working tree with rsync, so uninitialized submodules ship empty and the build can't find the subproject. Run `git submodule update --init --recursive` before building — `--recursive` matters for nested submodules.

- **Relocate hardcoded `DESTINATION lib` for lib64 distros.** A project that installs libs to a literal `lib` puts them in `/usr/lib` even on Fedora/openSUSE/EL/Mageia, where the loader looks in `/usr/lib64`, so at runtime the app can't find its own private libs. Fix in the spec `%install` (Debian's `/usr/lib` is correct, so guard on it):

    ```sh
    if [ "%{_libdir}" != "/usr/lib" ] && [ -d %{buildroot}/usr/lib ]; then
      mkdir -p %{buildroot}%{_libdir}; mv %{buildroot}/usr/lib/* %{buildroot}%{_libdir}/; fi
    ```

- **Nudge deb for private / no-SONAME libs.** Internal shared libs with no version (`libfoo.so`) carry no shlibs entry, so `dpkg-shlibdeps` reports *no dependency information found*. Add an override; rpm self-satisfies via basename Provides/Requires:

    ```makefile
    override_dh_shlibdeps:
    	dh_shlibdeps -l$(DESTROOT)/usr/lib -- --ignore-missing-info
    ```

- **QML modules and the SVG plugin aren't auto-detected.** They're dlopened, not linked, so list them in `runtime_dependencies` — see the [QML map](#qt6-dependencies) below.

!!! tip
    Working references: [`mpz`](https://github.com/olegantonyan/mpz/tree/master/.omnipackage) and [`rssguard`](https://github.com/olegantonyan/rssguard/tree/master/.omnipackage).

## Qt6 dependencies

Package names diverge per distro **family** — this is the main reason for per-family anchors. For a Qt6/CMake app using Core, Gui, Widgets, Network and PrintSupport (all in qtbase) plus **Core5Compat** and **LinguistTools**, and needing **GuiPrivate** (e.g. for a bundled docking system):

| Need | Fedora / RHEL | openSUSE | Debian / Ubuntu |
|---|---|---|---|
| compiler + build tools | `gcc-c++ cmake make git` | `gcc-c++ cmake make git` | `build-essential cmake git` |
| Qt6 base (Core/Gui/Widgets/Network/PrintSupport) | `qt6-qtbase-devel` | `qt6-base-devel` | `qt6-base-dev` |
| Qt6 **private** headers (GuiPrivate) | `qt6-qtbase-private-devel` | `qt6-base-private-devel` | `qt6-base-private-dev` |
| Core5Compat | `qt6-qt5compat-devel` | `qt6-qt5compat-devel` | `qt6-5compat-dev` |
| LinguistTools (lrelease) | `qt6-qttools-devel` | `qt6-tools-devel` + `qt6-linguist-devel` | `qt6-tools-dev` + `qt6-l10n-tools` |
| OpenGL dev | `mesa-libGL-devel` | `Mesa-libGL-devel` | `libgl-dev` |

On **AlmaLinux/Rocky**, Qt6 lives in EPEL/CRB, which aren't on the base image and install *after* `build_dependencies`. Pull them in `before_build_script` instead:

```yaml
el_rpm: &el_rpm
  <<: *common
  build_dependencies: [gcc-c++, cmake, make, git]
  before_build_script: >-
    dnf install -y epel-release &&
    dnf install -y --nobest --enablerepo=crb
    qt6-qtbase-devel qt6-qtbase-private-devel qt6-qttools-devel qt6-qt5compat-devel mesa-libGL-devel
  rpm: { spec_template: ".omnipackage/specfile.spec.liquid" }
```

### Runtime QML modules

A QML app dlopens its imported modules and the SVG imageformat plugin at runtime, so they must be explicit `runtime_dependencies`:

| Import / need | Fedora / RHEL | openSUSE | Debian / Ubuntu |
|---|---|---|---|
| QtQuick, QtQml, Layouts, Shapes, Controls, Dialogs, Templates, Qt.labs.* | `qt6-qtdeclarative` *(usually auto-pulled by the linked `libQt6Quick6` soname)* | **`qt6-declarative-imports`** *(separate package, **not** pulled by the soname — must list)* | one `qml6-module-*` per import: `qml6-module-qtquick`, `-qtquick-controls`, `-qtquick-dialogs`, `-qtquick-layouts`, `-qtquick-shapes`, `-qtcore`, `-qt-labs-platform`, `-qt-labs-qmlmodels`, `-qtqml-models`, `-qtqml-workerscript` |
| SVG imageformat plugin (SVG icons) | `qt6-qtsvg` | `libQt6Svg6` *(ships the plugin)* | `qt6-svg-plugins` *(not `libqt6svg6`, which is only the lib)* |

!!! warning
    On openSUSE the whole QtQuick/Controls import tree lives in `qt6-declarative-imports`, which the linked-soname deps do **not** pull — omit it and the app starts with `module "QtQuick" is not installed`. A missing module only shows at runtime, so confirm the real set with the smoke-test in [Verifying a built package](#verifying-a-built-package).

## Patching staged source

Sometimes the build needs a source change the repo doesn't have — a missing QML import, an extra `install()` rule, a stale flag — and you can't or shouldn't commit it. Patch the **staged** copy at build time: the change lives entirely in `.omnipackage/`, and the committed tree stays pristine.

Put an **idempotent** script in `.omnipackage/` (guard every edit so re-runs are no-ops) and call it from both formats — the rpm `%prep` (after `%setup`) and the deb `override_dh_auto_configure` (before configure):

```sh
# .omnipackage/patch-qml.sh — inject a private-module import that went fully
# private in QtQuick.Controls.impl in Qt 6.11 (harmless on older Qt).
set -eu
for f in $(grep -rlE '\bIconImage\b' src --include='*.qml' 2>/dev/null || true); do
  grep -q 'QtQuick\.Controls\.impl' "$f" || sed -i '/^import QtQuick\.Controls$/a import QtQuick.Controls.impl' "$f"
done
```

```spec
%prep
%setup -q -n {{ source_folder_name }}
sh .omnipackage/patch-qml.sh
```

```makefile
override_dh_auto_configure:
	sh .omnipackage/patch-qml.sh
	dh_auto_configure -- -DCMAKE_BUILD_TYPE=Release
```

`.omnipackage/` is part of the staged tree, so the script is present in-container at the source root. The same trick installs an upstream-forgotten file straight from the spec/`rules` (`install -Dm644 foo.metainfo.xml %{buildroot}%{_datadir}/metainfo/…`).

## Electron and Node

`init` detects `package.json` → electron. The whole build runs inside a shared `install.sh` called from the rpm `%install` and the deb `override_dh_auto_install` (the spec `%build` stays empty). It provisions Node, runs the JS build, runs `electron-builder --linux dir`, and stages `dist_electron/linux-unpacked/` into `/opt/<pkg>/`, writing the `.desktop` file, icons, and the `/usr/bin/<pkg>` launcher itself. Reference: [`pulsar`](https://github.com/olegantonyan/pulsar/tree/master/.omnipackage).

Provision the toolchain in `before_build_script` (runs in the source root):

```sh
# node-gyp needs a modern python3:
mkdir -p /usr/local/bin
for py in /usr/bin/python3.13 /usr/bin/python3.12 /usr/bin/python3.11; do
  [ -x "$py" ] && { ln -sf "$py" /usr/local/bin/python3; break; }
done
# gcc >= 11 where the default is older (needs gcc-NN / g++-NN in build_dependencies):
for v in 15 14 13 12 11; do
  if [ -x "/usr/bin/g++-$v" ]; then
    ln -sf /usr/bin/gcc-$v /usr/local/bin/gcc; ln -sf /usr/bin/gcc-$v /usr/local/bin/cc
    ln -sf /usr/bin/g++-$v /usr/local/bin/g++; ln -sf /usr/bin/g++-$v /usr/local/bin/c++; break
  fi
done
# nvm via curl (NOT wget — see the openSUSE TW gotcha in Troubleshooting):
export NVM_DIR=/nvm PROFILE=/profile; mkdir -p "$NVM_DIR"; touch "$PROFILE"
nvm --version || { curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash; source "$PROFILE"; }
```

Build and stage in `install.sh` (`$1` = buildroot, `$2` = package name):

```sh
source /profile
nvm install; corepack enable; nvm use     # Node from .nvmrc, yarn from packageManager
export HUSKY=0                             # husky's git hooks fail (.git is stripped)
yarn install                              # runs electron-builder install-app-deps
yarn <build>
( cd <app> && yarn electron-builder --linux dir --publish never )
mkdir -p "$1/opt/$2"; cp -a <app>/dist_electron/linux-unpacked/. "$1/opt/$2/"
# prune foreign/musl prebuilts — keep only this build's linux+arch:
U="$1/opt/$2/resources/app.asar.unpacked/node_modules"
case "$(uname -m)" in x86_64) drop=arm64;; aarch64) drop=x64;; *) drop=;; esac
find "$U" -depth ! -path '*/src/*' \( -iname '*darwin*' -o -iname '*win32*' -o -iname '*-musl*' \) -exec rm -rf {} +
[ -n "$drop" ] && find "$U" -depth -iname "*linux-$drop*" -exec rm -rf {} +
mkdir -p "$1/usr/bin"; ln -sf "/opt/$2/$2" "$1/usr/bin/$2"   # launcher symlink
```

The spec carries a few defines so rpm doesn't strip or shlibdep the prebuilt bundle:

```spec
%undefine __brp_mangle_shebangs                       # bundled node_modules use versionless shebangs
%define debug_package %{nil}
%define __os_install_post %{nil}                       # don't strip bundled/foreign-arch binaries
%global __requires_exclude ^.+\\.so\\(\\)\\(64bit\\)$   # drop unversioned bundled-soname Requires
```

The deb rules drive `install.sh` and disable strip/shlibdeps (TAB-indented):

```makefile
override_dh_auto_install:
	$(CURDIR)/.omnipackage/install.sh $(CURDIR)/debian/{{ package_name }} {{ package_name }}
override_dh_strip:
override_dh_shlibdeps:
```

deb runtime deps are explicit (shlibdeps is off) — the Electron desktop libs, with t64 alternations for newer releases: `"libgtk-3-0t64 | libgtk-3-0"`, `"libatspi2.0-0t64 | libatspi2.0-0"`, plus `libnotify4 libnss3 libxss1 libxtst6 libuuid1 libsecret-1-0 xdg-utils`. rpm auto-detects the versioned system libs.

!!! note
    Toolchain floor: **glibc ≥ 2.28** (Node 22 prebuilt) and **gcc ≥ 11** (C++20 `<source_location>`). EL8 (gcc-toolset needs `scl enable`) and pre-gcc11 Debian/Ubuntu can't build without a hack — drop them.

## pacman and Arch

`arch` and `manjaro` build the one `PKGBUILD.liquid` with `makepkg` (OmniPackage runs it as an unprivileged `omnibuild` user — nothing to configure). It's a normal PKGBUILD, Liquid-rendered:

```bash
pkgname={{ package_name }}
pkgver={{ version }}                  # makepkg forbids `-`; 0.99~master.<ts>.<hash> is fine
pkgrel=1
pkgdesc="{{ description }}"
arch=("$(uname -m)")                  # never hardcode x86_64 — makepkg sources this
url="{{ homepage }}"
{% if runtime_dependencies.size > 0 %}depends=({{ runtime_dependencies | join: ' ' }}){% endif %}
options=('!lto')                      # only if it links prebuilt C/asm (aws-lc-rs, ring)
source=("{{ source_folder_name }}.tar.gz")
sha256sums=('SKIP')                   # local staged tarball — nothing remote to verify

build()   { cd "$srcdir/{{ source_folder_name }}"; <compile>; }
package() { cd "$srcdir/{{ source_folder_name }}"; <install into $pkgdir>; }
```

- **`build_dependencies` are Arch names**; `base-devel` (gcc/make/…) is preinstalled. makepkg runs `--nodeps`, so these — not the PKGBUILD's `depends`/`makedepends` — install the toolchain. No `before_build_script` is needed (rust/go/crystal+shards/python+python-pip/ruby are all in the official repos).
- **install.sh-based types** (python/ruby/electron): `package()` just runs the shared `.omnipackage/install.sh "$pkgdir"` — no `build()`, no `!lto`.
- **Output:** `<name>-<ver>-<rel>-<arch>.pkg.tar.zst` + detached `.sig`; the signed repo db is `<project_slug>.db.tar.gz`.

## Verifying a built package

A successful build isn't proof the package installs and runs. Build one rpm and one deb, then inspect the contents and the auto-detected dependencies. The build host is often **not** Debian, so read the `.deb` with `ar`+`tar` rather than `dpkg`:

```sh
# RPM
rpm -qlp pkg.rpm     # files — expect only your paths, no bundled-lib headers/.a/cmake
rpm -qpR pkg.rpm     # Requires — expect auto-detected libs (Qt6, libc, libstdc++, …)
rpm -qip pkg.rpm     # name / version / license / summary

# DEB without dpkg (match the data member's extension: .xz/.zst/.gz)
m=$(ar t pkg.deb | grep '^data.tar')
ar p pkg.deb "$m" | xz -dc | tar -tf -                          # file list
ar p pkg.deb "$(ar t pkg.deb | grep '^control.tar')" | xz -dc | tar -xO ./control   # Depends/Description

# pacman (.pkg.tar.zst — zstd-aware tar, no pacman needed)
tar -xOf pkg.pkg.tar.zst .PKGINFO    # pkgname/pkgver/arch/depends
tar -tf  pkg.pkg.tar.zst             # files (ignore the .PKGINFO/.BUILDINFO/.MTREE dotfiles)
```

Static inspection misses **runtime** gaps — a dlopened QML module or plugin that isn't a dependency. For GUI apps, smoke-test the real package in a throwaway container: install it (pulling deps) and run it headless.

```sh
# DEB (apt resolves deps from a local file with the leading ./)
podman run --rm -v "$DEB":/p.deb:ro,Z debian:13 bash -c \
  'apt-get update -qq && apt-get install -y ./p.deb && QT_QPA_PLATFORM=offscreen timeout 6 myapp 2>&1 | grep -i "not a type\|not installed" && echo BROKEN || echo OK'
```

See also [Best practices → Test the installed package](best_practices.md#test-the-installed-package-not-just-the-build) and [`omnipackage portal`](../cli/portal.md).

{% endraw %}
