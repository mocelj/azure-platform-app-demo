# Contributing

For an infrastructure request, edit the relevant
`apps/<service>/<engine>/platform-app.json`. The [walkthrough](docs/walkthrough.md)
uses a size change to illustrate the process. Engine selection, networking,
identity, dependencies, and security settings are maintained in the catalog.

Validate against the catalog revision selected in `catalog-version.json`:

```powershell
Set-Location ..\azure-platform-catalog
npm ci --ignore-scripts
node scripts/platform.mjs check-consumer --directory ..\azure-platform-app-demo
```

For sample payload changes, run separately:

```powershell
Set-Location ..\azure-platform-app-demo\samples\web-app
npm ci --ignore-scripts
npm test
npm run check
```

Describe the target, reason for the change, and validation results. Keep
configuration PRs focused so their infrastructure impact is easy to review.
Real environment IDs, credentials, SSH private keys, state, and saved plans
belong outside this public repository.

Workflow, catalog-version, ownership, and policy changes need a separate
platform-maintainer review. Application changes also have their own build and
artifact release process; configuration validation does not execute application
source on the private infrastructure runner.

CODEOWNERS routes reviews, while repository rules enforce them. This example
uses one maintainer; a production process needs independent reviewers where
separation of duties is required. Original contributions use the [MIT license](LICENSE).
