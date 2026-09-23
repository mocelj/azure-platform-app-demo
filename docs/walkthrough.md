# A configuration PR, not an infrastructure ticket

Use this path without Azure first. The presenter can show the contract, allowed change, rejected escape, rendered data, and trust boundary even when no private runner exists. Do not present rendered JSON as a real plan.

## 1. Inspect the approved product

Open the catalog's [`platform.json`](https://github.com/mocelj/azure-platform-catalog/blob/main/catalog/platform.json), [schema](https://github.com/mocelj/azure-platform-catalog/blob/main/schemas/platform-app.schema.json), and [Web App Bicep wrapper](https://github.com/mocelj/azure-platform-catalog/blob/main/platform-apps/web-app/bicep/main.bicep) at the reviewed catalog revision. The developer sees a size; the platform owns its SKU mapping and controls.

Use sibling local checkouts. From `azure-platform-catalog`:

```powershell
npm ci --ignore-scripts
node scripts/platform.mjs check-consumer --directory ..\azure-platform-app-demo
```

All eight requests start as `ledger`, `demo`, `small`. The folder determines the service-engine target.

## 2. Make one permitted change

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

The validator should accept this request. Review the diff and target/configuration hash. The generated parameters show a selected tier, not a cost estimate or proof that Azure can resize the resource.

Open a PR using the template. Hosted checks use the catalog's immutable pin and have no Azure credentials, private runner, or backend access. A change to workflow/policy/pin files is **not** part of this configuration-only exercise. Independent catalog revalidation remains authoritative even if a contributor edits consumer checks.

## 3. Show a denied public-access request

Explain the attempted second PR:

```diff
   "environment": "demo",
-  "size": "small"
+  "size": "small",
+  "publicNetworkAccess": "Enabled"
```

This property is not a developer choice. The schema uses `additionalProperties: false`; the wrapper also fixes private access. Do not add the invalid example to the eight live requests.

For a repeatable local rejection, use **PowerShell 7** in the catalog root. This creates only a disposable copy under ignored `out`:

```powershell
New-Item -ItemType Directory -Force out | Out-Null
$request = Get-Content ..\azure-platform-app-demo\apps\web-app\bicep\platform-app.json -Raw | ConvertFrom-Json
$request | Add-Member -NotePropertyName publicNetworkAccess -NotePropertyValue Enabled
$request | ConvertTo-Json | Set-Content out\denied-public-access.json -Encoding utf8NoBOM
node scripts/platform.mjs validate --config out\denied-public-access.json --target web-app-bicep
if ($LASTEXITCODE -eq 0) { throw 'The forbidden property was unexpectedly accepted.' }
Remove-Item out\denied-public-access.json
```

Expected behavior: a nonzero exit and a configuration-rejected message about an additional property. That is a successful negative demonstration, not a broken deployment. No cloud operation occurs. The same boundary rejects arbitrary resource IDs, image/module URLs, security knobs, and an engine property.

## 4. Compare engines without migrating

```powershell
node scripts/platform.mjs validate --config ..\azure-platform-app-demo\apps\web-app\terraform\platform-app.json --target web-app-terraform
node scripts/platform.mjs render --config ..\azure-platform-app-demo\apps\web-app\terraform\platform-app.json --target web-app-terraform --environment environments\demo.example.json --out out\web-app-terraform
Get-Content out\web-app-terraform\app.tfvars.json
Get-Content out\web-app-terraform\backend.hcl
```

Both engines accept the same five-field contract and receive the unchanged name `ledger`. Target, resource-group binding, and Terraform state key differ; wrappers own final Azure names, so the rendered application name is not necessarily the deployed resource name. The Terraform request remains `small` unless separately changed. Renaming an engine folder is not an infrastructure migration; do not import Bicep-owned resources into Terraform.

## 5. Handoff after review

This stage is **not run** by the offline walkthrough:

1. Merge only the reviewed configuration change. Record its full consumer commit SHA and target.
2. A catalog maintainer opens the catalog's `.github/workflows/catalog-dispatch.yml` workflow on its protected default branch, not a workflow supplied by the consumer.
3. Both `plan` and `apply` accept only an exact 40-hex consumer SHA already merged into the approved `main`. There is no premerge Azure preview in this release: all PR validation is offline.
4. The trusted workflow validates repository/path, source pins, target, commit relationship, configuration, and environment bindings before connected work. It reads JSON as data; it does not execute consumer source.
5. Planning stores its result in the private `plans` Blob container and prints a sanitized `plan_id`; it does not publish a raw plan artifact. Apply selects that reviewed plan, requires matching configuration/catalog/environment hashes, and pauses for explicit `demo-apply` environment approval. Changed bindings require a new plan and review.

After the prerequisites are satisfied, a maintainer can dispatch from PowerShell using authenticated GitHub CLI:

```powershell
$target = 'web-app-bicep'
$consumerSha = '<merged-consumer-commit-40-hex>'
gh workflow run catalog-dispatch.yml -R mocelj/azure-platform-catalog -f operation=plan -f "target=$target" -f "consumer_sha=$consumerSha"
```

Review the private result and sanitized summary. Copy the successful plan's printed ID, then dispatch apply with the **same target and consumer SHA**:

```powershell
$planId = '<plan_id-printed-by-successful-plan>'
gh workflow run catalog-dispatch.yml -R mocelj/azure-platform-catalog -f operation=apply -f "target=$target" -f "consumer_sha=$consumerSha" -f "plan_id=$planId"
```

The workflow runs trusted catalog code on its protected `main`; do not request an arbitrary catalog ref. The `plan_id` identifies reviewed private plan material, not approval to skip `demo-apply`.

Keep `ENABLE_AZURE_DEPLOYMENT` unset/false until the [catalog prerequisites](https://github.com/mocelj/azure-platform-catalog/blob/main/docs/rehearsal.md) are satisfied. A disabled/skipped connected job is **not configured / not run**, not verified. There is no automatic PAT/App-based cross-repository dispatch.

The private runner is registered only to the catalog, isolated from customer networks, and never accessible to consumer PRs. Public-repository self-hosted execution is still a demo risk. A real FSI execution plane belongs in a private organizational repository with restricted runners and independent approvals.

## 6. Distinguish infrastructure from application success

Web App infrastructure does not deploy `samples\web-app`. Use the [separate trusted payload release](web-app-payload.md). Container App's catalog image is an illustrative, digest-pinned hello-world image, not this Node source and not a hardened business application.

Record which checks actually ran. Azure deployment, private DNS, negative public-access tests, Entra authorization, application health, telemetry, and cleanup remain **unverified live gates** until independently exercised. One presenter's manual pause demonstrates approval mechanics, not separation of duties.
