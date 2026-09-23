# Azure platform app demo

[![Developer request validation](https://github.com/mocelj/azure-platform-app-demo/actions/workflows/validate.yml/badge.svg)](https://github.com/mocelj/azure-platform-app-demo/actions/workflows/validate.yml)

Request an approved Azure capability with a small PR; leave infrastructure implementation to the platform team.

This repository is the developer side of [azure-platform-catalog](https://github.com/mocelj/azure-platform-catalog). It contains eight independent requests and a minimal Web App payload. It does **not** contain deployment credentials, customer data, arbitrary IaC, or a private runner.

> This is an offline-first platform-engineering demonstration for an FSI audience. It is not production-ready, FSI-compliant, or evidence of a successful Azure deployment. Connected stages and application health remain separate verification gates.

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

The approved choices are four services and `small` or `medium` size. The selected folder fixes the engine. The renderer passes the validated application name unchanged; platform wrappers own final Azure names. The platform also owns region, network/DNS, identity, state, runtime/image, module versions, and security controls. Extra properties are rejected.

## Quickstart without Azure

Keep the two repositories in sibling directories. Use the reviewed catalog revision selected by the platform owner; do not replace its immutable execution pin with a floating branch.

The selected release and full commit are in [catalog-version.json](catalog-version.json).
The reusable workflow checks that this file matches its immutable catalog pin.

From this repository's root:

```powershell
Set-Location ..\azure-platform-catalog
npm ci --ignore-scripts
node scripts/platform.mjs check-consumer --directory ..\azure-platform-app-demo
node scripts/platform.mjs validate --config ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json --target web-app-bicep
node scripts/platform.mjs render --config ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json --target web-app-bicep --environment environments\demo.example.json --out out\web-app-bicep
```

Use Node **24.18.0** and npm **11.16.0**. Rendering writes parameter data and hashes, not an Azure plan or deployment. The example environment contains synthetic bindings.

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

Equal JSON does not mean shared resources. Separate target resource groups and Terraform state keys distinguish the instances; wrappers handle final Azure names within those scopes. Moving a file or changing engines is not a migration.

## Demonstrate the handoff

Follow the [walkthrough](docs/walkthrough.md): change `small` to `medium`, then show why adding `publicNetworkAccess` is rejected. Public PR checks have no Azure identity. Both connected plan and apply require an exact consumer SHA already merged into approved `main`; this release has no premerge Azure preview. A maintainer dispatches the protected **catalog** workflow; the trusted runner revalidates configuration as data. Apply references a reviewed private `plan_id` and requires `demo-apply` approval with matching configuration/catalog/environment hashes.

Infrastructure provisioning does not deploy this repository's Node source. See [trusted Web App payload release](docs/web-app-payload.md) for the private SCM/Entra ZIP path. Never build or execute an untrusted PR payload on the privileged infrastructure runner.

[Architecture](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/architecture.md) · [Platform concepts](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/concepts.md) · [Control exceptions](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/security-controls.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [License](LICENSE)

Links to `main` are for reading documentation. Execution requires the reviewed full catalog commit pin.
