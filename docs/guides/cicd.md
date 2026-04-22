# CI/CD integration

Running `omnipackage release` from CI so every tag (or every push to a release branch) produces signed packages in your repository.

## Scope

- GitHub Actions workflow template
- GitLab CI template
- Storing the GPG key and S3 credentials as CI secrets
- Passing secrets through to `omnipackage` without writing them to disk
- Using the `prime` command to cache container images between runs
- Gating releases on version extractors (e.g., only release when the tag matches)
- Caching `--build-dir` between runs

<!-- TODO: actual yaml snippets -->
