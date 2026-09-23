# Azure platform app demo

[![Developer request validation](https://github.com/mocelj/azure-platform-app-demo/actions/workflows/validate.yml/badge.svg)](https://github.com/mocelj/azure-platform-app-demo/actions/workflows/validate.yml)

This repository shows the application team's side of
[azure-platform-catalog](https://github.com/mocelj/azure-platform-catalog).
Developers request infrastructure through JSON configuration and a PR, while the
platform team manages the Bicep or Terraform implementation, networking, identity,
and deployment.

There are eight independent requests: Storage, VM, Web App, and Container App,
each in both languages. A small Node application is included for the Web App.
Both repositories have public `v0.1.0` releases and passing CI. No Azure
deployment has been performed, and connected execution is disabled by default.

## The request

```json
{
  "schemaVersion": "1.0",
  "platformApp": "web-app",
  "name": "ledger",
  "environment": "demo",
  "size": "small"
}
```

The request selects a service and a `small` or `medium` tier. Its folder determines
the engine. The renderer passes the application name to the wrapper, which
generates Azure resource names. Region, networking, DNS, identity, state,
runtime/image, dependencies, and security settings remain in the catalog rather
than being repeated in each application request.

## Quickstart without Azure

Keep the two repositories in sibling directories and use the catalog commit in
[catalog-version.json](catalog-version.json). CI checks that this release
metadata matches its workflow reference, so local validation uses the same
implementation as the PR checks.

From this repository's root:

```powershell
Set-Location ..\azure-platform-catalog
npm ci --ignore-scripts
node scripts/platform.mjs check-consumer --directory ..\azure-platform-app-demo
node scripts/platform.mjs validate --config ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json --target web-app-bicep
node scripts/platform.mjs render --config ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json --target web-app-bicep --environment environments\demo.example.json --out out\web-app-bicep
```

Use Node `24.18.0` and npm `11.16.0`. These commands validate the request and
render parameter data without contacting Azure. The example environment contains
placeholder IDs for local use.

To run the payload locally:

```powershell
Set-Location ..\azure-platform-app-demo\samples\web-app
npm ci --ignore-scripts
npm test
npm run check
npm start
```

Visit `http://localhost:3000/` and `/healthz`. This Node sample is for Web App; Container App uses the catalog's digest-pinned image.

## Choose one target

| Service | Bicep request | Terraform request |
| --- | --- | --- |
| Blob Storage | [storage-bicep](apps/storage/bicep/platform-app.json) | [storage-terraform](apps/storage/terraform/platform-app.json) |
| Linux VM | [vm-bicep](apps/vm/bicep/platform-app.json) | [vm-terraform](apps/vm/terraform/platform-app.json) |
| Web App | [web-app-bicep](apps/web-app/bicep/platform-app.json) | [web-app-terraform](apps/web-app/terraform/platform-app.json) |
| Container App | [container-app-bicep](apps/container-app/bicep/platform-app.json) | [container-app-terraform](apps/container-app/terraform/platform-app.json) |

The two engines manage separate resource groups and Terraform state keys.
They demonstrate the same configuration model without sharing ownership of Azure
resources. Moving a file between engine folders would not migrate an instance.

## From PR to deployment

The [walkthrough](docs/walkthrough.md) follows a size change from `small` to
`medium` and shows how the schema handles a public-access override. PR checks
run without Azure credentials or private-runner access.

After merge, a platform maintainer dispatches plan and apply in the catalog
using the consumer commit SHA. There is no premerge Azure preview. Apply uses
the reviewed private `plan_id`, verifies source and environment hashes, and
waits for `demo-apply` approval.

Application content is a separate release. The [Web App guide](docs/web-app-payload.md)
covers packaging and Entra-authenticated ZIP deployment over private SCM.
Builds run outside the infrastructure runner, which reads configuration but does
not execute consumer code.

[Architecture](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/architecture.md) · [Platform concepts](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/concepts.md) · [Control exceptions](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/security-controls.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [License](LICENSE)

Links to `main` are for browsing documentation; validation and deployment use
the catalog commit selected in the version metadata. The original wrappers and
sample are MIT-licensed work by `mocelj`, with official AVM dependencies retaining
their upstream attribution.
