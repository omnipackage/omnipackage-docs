# Templates

OmniPackage renders the RPM `.spec` file, the DEB `debian/` control files, and the pacman `PKGBUILD` from [Liquid](https://shopify.github.io/liquid/) templates. This page covers what's available in the template context and how to thread per-distro values into a single shared template.

## Why template

A working `.spec` file or `debian/control` is mostly boilerplate identical across distros in a family — same `%build` recipe, same `Source0`, same `Description`. The parts that differ are small: package dependency names (`qt6-base-common-devel` on openSUSE vs. `qt6-qtbase-devel` on Fedora), optional CMake flags (Qt5 vs. Qt6), occasional tool overrides (a different compiler on an older distro).

Without templating, you would carry a copy of the spec for every distro and watch them drift. With templating, one `.spec.liquid` and one `debian/` directory; everything that varies — names, version, maintainer, deps, custom flags — comes from `config.yml` per distro.

## Where templates live

In `config.yml`:

```yaml
rpm:
  spec_template: ".omnipackage/myapp.spec.liquid"

deb:
  debian_templates: ".omnipackage/deb"

pacman:
  pkgbuild_template: ".omnipackage/PKGBUILD.liquid"
```

- **RPM**: a single file ending in `.liquid`. The rendered output goes into the rpmbuild tree as the spec file.
- **DEB**: a directory. Every file inside ending in `.liquid` is rendered (the `.liquid` suffix is stripped: `control.liquid` → `control`). Files without `.liquid` are copied verbatim — useful for `compat`, license files, scripts, etc.
- **pacman**: a single file ending in `.liquid`. The rendered output is the `PKGBUILD` that `makepkg` builds (Arch, Manjaro) — a normal PKGBUILD with `build()` / `package()` functions.

A typical DEB tree contains `control.liquid`, `changelog.liquid`, `rules.liquid`, and `compat.liquid`. See the [`c_makefile` example](https://github.com/omnipackage/examples/tree/master/c_makefile/.omnipackage/deb) for a complete minimal set.

## Built-in variables

Every template renders with these in scope:

| Variable               | Type                     | Source                                                                                                                |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `version`              | string                   | Output of the configured `version_extractor`                                                                          |
| `current_time_rfc2822` | string                   | Render-time timestamp; used in `debian/changelog`                                                                     |
| `package_name`         | string                   | From the build entry in `config.yml`                                                                                  |
| `maintainer`           | string                   | From the build entry                                                                                                  |
| `homepage`             | string                   | From the build entry                                                                                                  |
| `description`          | string                   | From the build entry                                                                                                  |
| `build_dependencies`   | array of strings         | From the build entry                                                                                                  |
| `runtime_dependencies` | array of strings         | From the build entry                                                                                                  |
| `secrets`              | object (string → string) | From the `secrets:` block; access as `{{ secrets.MY_KEY }}`                                                           |
| `source_folder_name`   | string                   | RPM and pacman — name of the staged source tarball directory (the pacman source is `{{ source_folder_name }}.tar.gz`) |

Arrays render with the Liquid `join` filter:

```liquid
BuildRequires: {{ build_dependencies | join: ' ' }}
Requires: {{ runtime_dependencies | join: ', ' }}
```

(RPM uses spaces, DEB uses `,` — the templates choose, not the engine.)

## Custom per-distro variables

Any field on a build entry in `config.yml` beyond the known keys above is passed straight into the template context with the same name. This is the mechanism for per-distro variation.

Example from [`mpz`](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/config.yml) — same Qt-based project compiled against Qt5 or Qt6 depending on the distro:

```yaml
debian_qt5: &debian_qt5
  build_dependencies: [gcc, make, cmake, qtbase5-dev, qtmultimedia5-dev]
  CMAKE_EXTRA_CLI: "-DUSE_QT5=ON"
  <<: *deb

debian_qt6: &debian_qt6
  build_dependencies: [gcc, make, cmake, qt6-base-dev, qt6-multimedia-dev]
  <<: *deb

builds:
  - distro: "debian_12"
    <<: *debian_qt5
  - distro: "debian_13"
    <<: *debian_qt6
```

Then in the [shared spec / rules templates](https://github.com/olegantonyan/mpz/blob/master/.omnipackage/deb/rules.liquid):

```liquid
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr {{ CMAKE_EXTRA_CLI }} ..
```

For Qt5 distros this expands to `... -DUSE_QT5=ON ..`; for Qt6 distros it expands to `... ..` (the extra space is harmless to `cmake`). One template, two distro flavors, no fork.

Custom values can be strings, integers, floats, or booleans — whatever YAML produces. They are addressed by the same key used in YAML.

## Liquid basics

- `{{ var }}` — substitute a value.
- `{{ var | filter }}` — apply a filter (`join`, `upcase`, `default`, `size`, etc.).
- `{% if cond %}...{% endif %}` — conditional block.
- `{% for x in arr %}...{% endfor %}` — loop.

Useful patterns:

```liquid
{% if runtime_dependencies.size > 0 %}
Requires: {{ runtime_dependencies | join: ', ' }}
{% endif %}
```

```liquid
{{ secrets.SENTRY_DSN | default: "" }}
```

## Undefined variables render as empty

Referencing a variable that was not set anywhere does **not** error — it renders as an empty string (and evaluates as falsy in `{% if %}`). This is deliberate, so a custom variable like `CMAKE_EXTRA_CLI` can be set on some distros and omitted on others without conditional guards in the template.

The flip side: typos render silently. If a value is not appearing where you expect, double-check the spelling in both `config.yml` and the template.
