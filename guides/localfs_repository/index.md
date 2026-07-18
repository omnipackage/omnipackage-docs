# Publishing to a local directory

S3 is not mandatory. The `localfs` provider writes the same signed repository tree to a directory on the host instead of uploading it to a bucket. The output is a standard DEB/RPM/pacman repository, identical to what an S3 target produces.

Use it to:

- inspect exactly what `publish` generates,
- install on the same machine without any server,
- self-host behind a web server or shared mount you already run.

## Configuration

```yaml
- name: Local
  provider: localfs
  gpg_private_key_base64: "${GPG_KEY}"
  package_name: "sample-project"
  localfs:
    path: "${HOME}/sample-project-repo"
```

`path` is the only `localfs` key. Environment placeholders such as `${HOME}` are expanded from the [env file](https://docs.omnipackage.org/configuration/secrets/index.md). The directory is created if it does not exist.

## What gets written

Each distro lands in its own subdirectory named by [distro id](https://docs.omnipackage.org/distros/index.md), with the package, the signed native repo metadata, and the public key. The generated [install page](https://docs.omnipackage.org/guides/install_page/index.md) and its sibling files sit at the root:

```text
sample-project-repo/
├── install.html      # human-facing install page
├── install.sh        # one-line installer, detects the distro
├── install.json      # per-distro data, machine-readable
├── badge.svg         # repo status badge
├── fedora_42/
│   ├── sample-project.repo
│   ├── repodata/
│   └── sample-project-1.0-1.x86_64.rpm
├── debian_12/
│   └── stable/
│       ├── Release
│       ├── Release.key
│       ├── Packages.gz
│       └── sample-project_1.0_amd64.deb
└── arch/
    ├── public.key
    ├── sample-project.db.tar.gz
    └── sample-project-1.0-1-x86_64.pkg.tar.zst
```

## Inspect and install locally

Open `install.html` in a browser for the per-distro install snippets, or run `install.sh` to detect the distro and install in one step; `install.json` carries the same data for scripts. Because `localfs` has no public URL, the snippets point at `path` on disk, so they work as-is for installing on the same machine.

## Self-hosting

The directory is a complete, standard repository. To serve it over the network, point any static web server (nginx, Caddy, `python -m http.server`) at `path`, or place it on an NFS/SMB share. Package managers consume it like any other repo.

The generated `install.html` links use the on-disk `path`, not your server's URL, so for a networked repo give consumers the repository URL directly. For a turnkey public repo with a matching install page, an [S3-compatible backend](https://docs.omnipackage.org/guides/s3_repository/index.md) is simpler — including self-hosted MinIO, which speaks the same S3 API.

## Retention

[`retain_packages`](https://docs.omnipackage.org/configuration/repositories/#package-retention) works the same as for S3: each `publish`/`release` keeps the N most recent packages per distro plus the new build and prunes the rest from `path`.
