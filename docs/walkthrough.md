# Changing an application request

This walkthrough follows a Web App size change through local validation, PR
review, and the platform deployment handoff. The first four sections run without
Azure access. The deployment section requires the private environment described
in the catalog.

## 1. Review the service configuration

The catalog's [`platform.json`](https://github.com/mocelj/azure-platform-catalog/blob/main/catalog/platform.json),
[schema](https://github.com/mocelj/azure-platform-catalog/blob/main/schemas/platform-app.schema.json),
and [Web App wrapper](https://github.com/mocelj/azure-platform-catalog/blob/main/platform-apps/web-app/bicep/main.bicep)
show how an application request maps to infrastructure. The developer chooses
a size tier; the platform team maintains its SKU and security settings.

Use the catalog revision recorded in `catalog-version.json`, with the two
repositories in sibling directories. From `azure-platform-catalog`:

```powershell
npm ci --ignore-scripts
node scripts/platform.mjs check-consumer --directory ..\azure-platform-app-demo
```

The eight sample requests use `ledger`, `demo`, and `small`. Each folder identifies
a separate service-engine target.

## 2. Change the size

In a new consumer branch, edit only `apps\web-app\bicep\platform-app.json`:

```diff
-  "size": "small"
+  "size": "medium"
```

From the catalog checkout:

```powershell
node scripts/platform.mjs validate --config ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json --target web-app-bicep
node scripts/platform.mjs render --config ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json --target web-app-bicep --environment environments\demo.example.json --out out\web-app-bicep
Get-Content out\web-app-bicep\deployment.json
Get-Content out\web-app-bicep\app.parameters.json
```

The request passes validation because `medium` is part of the schema. Review the
generated parameters and configuration hash, then open a PR using the template.
Rendering prepares deployment inputs; an Azure plan or what-if later evaluates
the resource changes.

Hosted PR checks use the pinned catalog without Azure credentials or private
backend access. Keep workflow, policy, and catalog-version changes in a separate
platform PR so the requested resize is easy to review. The catalog revalidates
the merged request before deployment, independently of consumer CI.

## 3. Check how the schema handles an override

A request that also tries to enable public access would look like this:

```diff
   "environment": "demo",
-  "size": "small"
+  "size": "small",
+  "publicNetworkAccess": "Enabled"
```

`publicNetworkAccess` is outside the request interface. The schema rejects it
through `additionalProperties: false`, and the wrapper configures private access
independently. This keeps networking decisions with the platform team rather
than making each application PR a network-policy change.

To test the rejection without changing the sample requests, use PowerShell 7
from the catalog root. The copy is written under ignored `out`:

```powershell
New-Item -ItemType Directory -Force out | Out-Null
$request = Get-Content ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json -Raw | ConvertFrom-Json
$request | Add-Member -NotePropertyName publicNetworkAccess -NotePropertyValue Enabled
$request | ConvertTo-Json | Set-Content out\denied-public-access.json -Encoding utf8NoBOM
node scripts/platform.mjs validate --config out\denied-public-access.json --target web-app-bicep
if ($LASTEXITCODE -eq 0) { throw 'The forbidden property was unexpectedly accepted.' }
Remove-Item out\denied-public-access.json
```

The validator returns a nonzero exit with an additional-property error. The same
rule excludes resource IDs, image/module URLs, and an engine property from
developer configuration. No Azure operation is involved.

## 4. Compare the Terraform request

```powershell
node scripts/platform.mjs validate --config ..\azure-platform-app-demo\apps\web-app\terraform\platform-app.json --target web-app-terraform
node scripts/platform.mjs render --config ..\azure-platform-app-demo\apps\web-app\terraform\platform-app.json --target web-app-terraform --environment environments\demo.example.json --out out\web-app-terraform
Get-Content out\web-app-terraform\app.tfvars.json
Get-Content out\web-app-terraform\backend.hcl
```

Both engines accept the same fields and receive `ledger` as the application
name. Their target, resource group, and state differ; each wrapper generates
its Azure names within that scope. The Terraform request remains `small` unless
changed separately. It represents another instance, not a migration or import
of the Bicep deployment.

## 5. Handoff after review

After merge, record the consumer commit's full 40-character SHA and target.
A catalog maintainer runs `catalog-dispatch.yml` from the catalog's protected
`main`. Both plan and apply require a consumer commit already on `main`; this
release has no premerge Azure preview.

Before Azure operations, the workflow checks repository/path, catalog source,
target, ancestry, configuration, and environment bindings. It reads JSON as data
without executing consumer code. Plan writes its result to the private `plans`
container and returns a `plan_id` in the sanitized summary.

Once the [deployment prerequisites](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/rehearsal.md)
are in place, the maintainer can dispatch with authenticated GitHub CLI:

```powershell
$target = 'web-app-bicep'
$consumerSha = '<merged-consumer-commit-40-hex>'
gh workflow run catalog-dispatch.yml -R mocelj/azure-platform-catalog -f operation=plan -f "target=$target" -f "consumer_sha=$consumerSha"
```

Review the private result, then use its printed ID to dispatch apply with the
same target and consumer SHA:

```powershell
$planId = '<plan_id-printed-by-successful-plan>'
gh workflow run catalog-dispatch.yml -R mocelj/azure-platform-catalog -f operation=apply -f "target=$target" -f "consumer_sha=$consumerSha" -f "plan_id=$planId"
```

Apply requires approval in `demo-apply` and matching configuration, catalog, and
environment hashes. Changed inputs need a new plan and review. The workflow runs
the catalog's protected source, rather than an arbitrary reference supplied by
the consumer.

`ENABLE_AZURE_DEPLOYMENT` remains unset/false until the environment is ready.
A skipped connected job has not performed Azure checks. Dispatch is manual,
without a PAT or GitHub App credential for automatic cross-repository calls.

The private runner is registered only to the catalog and isolated from customer
networks. Its use in a public repository, and the solo-presenter approval model,
are demo exceptions. Production should use a private execution repository,
restricted runners, and independent approval.

## 6. Release and verify the application

Web App provisioning creates hosting resources but does not deploy
`samples\web-app`. Use the [application release guide](web-app-payload.md) to build
and publish that content. Container App uses a separate digest-pinned
hello-world image rather than the Node source.

No Azure deployment has been performed for this release. The first deployment
needs private DNS, public-access denial, Entra authorization, application health,
telemetry, and cleanup checks in addition to the passing CI results.
