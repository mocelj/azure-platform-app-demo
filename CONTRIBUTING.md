# Contributing

For the developer walkthrough, change only the selected `apps/<service>/<engine>/platform-app.json`. Use the [permitted size change](docs/walkthrough.md); engine, region, network, identity, dependencies, and security controls are platform-owned.

From a sibling catalog checkout at the approved revision:

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

Explain the target and intent, include actual validation results, and keep the diff small. Do not add environment secrets, IDs from a real customer, state, saved plans, credentials, or SSH private keys.

Changes to workflows, catalog pins, ownership, or policy need platform-maintainer review. Do not mix such changes with a configuration-only PR. Payload releases are separately reviewed artifacts; a configuration PR does not authorize executing its application source on a private runner.

CODEOWNERS requests review but does not enforce branch protection. The demonstration uses one maintainer; this is not independent separation of duties. Original contributions use the [MIT license](LICENSE).
