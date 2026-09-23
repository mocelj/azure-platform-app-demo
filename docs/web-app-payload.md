# Web App payload release

Infrastructure provisioning and application content deployment are separate operations. The infrastructure runner must never check out or execute an untrusted consumer PR, including its `npm` scripts, install hooks, ZIP deployment hooks, or application code.

This guide describes a **future trusted release**, not an executed deployment. Keep basic publishing authentication disabled. Do not use a publishing profile, FTP, Shared Key/SAS workaround, public SCM exposure, or long-lived Azure secret.

## Runtime contract

The dependency-free [sample](../samples/web-app/README.md) is version **0.1.0**, tested with exact local Node **24.18.0** / npm **11.16.0**. It runs with `node server.js` and honors App Service's `PORT`.

The wrapper uses Linux **`NODE|24-lts`**. App Service selects and patches the runtime within that supported family; `engines.node` in the sample is a development/test pin, **not** a guarantee of the Azure patch version. Verify the live runtime and platform support before release. If exact runtime bytes are a requirement, a separately approved digest-pinned container supply chain is needed; do not claim this native Web App meets that requirement.

Both Web App implementations configure startup as `node server.js` and explicitly route all outbound traffic through VNet integration (`outboundVnetRouting.allTraffic = true`). Those infrastructure settings do not upload this payload or prove private SCM reachability.

The sample exposes no environment details and has no external dependencies. It also has no authentication or business-data controls. A successful `/healthz` response only confirms that its HTTP process runs.

## Build and review away from the private runner

Use a reviewed immutable application commit in an isolated, credential-free build environment. For this walkthrough the commands below assume **PowerShell 7**, starting in the consumer root:

```powershell
Set-Location samples\web-app
npm ci --ignore-scripts
npm test
npm run check
New-Item -ItemType Directory -Force out | Out-Null
Compress-Archive -Path server.js,package.json,package-lock.json -DestinationPath out\web-app-0.1.0.zip -Force
Get-FileHash out\web-app-0.1.0.zip -Algorithm SHA256
```

The ZIP contains these three files at its root, not an enclosing repository directory. Record the exact application commit, artifact SHA-256, sample version, test evidence, and reviewer approval together. Upload the artifact through a separately approved release channel; do not fetch a user-supplied URL on the privileged runner.

Before promotion, inspect the archive and package manifest. Reject additional executable deployment hooks, `.deployment`/custom build scripts, unexpected files, dependencies, or changed startup behavior unless separately reviewed. Do not enable `SCM_DO_BUILD_DURING_DEPLOYMENT`: this payload needs no restore/build during deployment.

## Entra-based ZIP deployment from a private path

Prerequisites:

- The selected Web App target already exists; use its reviewed resource group and app name, never guessed identifiers.
- The deployment actor has narrowly scoped app deployment permissions, including the relevant publish operation, through an approved Entra identity. Infrastructure ownership does not automatically grant payload-release authority.
- The existing trusted private runner can resolve and reach **both** `<app>.azurewebsites.net` and `<app>.scm.azurewebsites.net` through the private endpoint.
- Azure CLI **2.88.0** is available and authenticated through the approved short-lived identity flow. No ambient subscription Owner identity is acceptable.
- Both SCM and FTP basic publishing remain disabled; site/SCM TLS and public-access controls remain unchanged.
- The locally staged ZIP's digest matches the independently reviewed release record.

On the trusted private release runner, after its approved Entra login and artifact transfer:

```powershell
$resourceGroup = '<reviewed-target-resource-group>'
$appName = '<reviewed-web-app-name>'
$artifact = '<local-reviewed-artifact-path>'
$approvedSha256 = '<sha256-from-independent-release-record>'

if ((Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash -ne $approvedSha256) {
    throw 'Artifact digest does not match the reviewed release.'
}
Resolve-DnsName "$appName.azurewebsites.net"
Resolve-DnsName "$appName.scm.azurewebsites.net"
Test-NetConnection "$appName.scm.azurewebsites.net" -Port 443
az webapp deploy --resource-group $resourceGroup --name $appName --src-path $artifact --type zip --only-show-errors --output none
if ($LASTEXITCODE -ne 0) { throw 'ZIP deployment failed; do not weaken access controls.' }
Invoke-RestMethod "https://$appName.azurewebsites.net/healthz"
Invoke-RestMethod "https://$appName.azurewebsites.net/"
```

Inspect DNS results: the complete resolution chain must end at the approved private endpoint address. The connectivity commands are Windows-specific; use equivalent DNS/TCP checks on a Linux private runner. Do not log tokens or enable Azure CLI debug traces in public jobs.

Microsoft documents Entra fallback for `az webapp deploy` with basic publishing disabled in Azure CLI 2.48.1 and later. The selected 2.88.0 pin meets that version prerequisite; **this repository has not thereby proven live authorization, SCM reachability, or successful ZIP deployment**. If authentication fails, inspect identity scope, federated subject/audience, app publish permissions, and DNS/routes. Never re-enable basic publishing to make the demo pass.

Archive the sanitized release result separately from raw deployment logs. Also test that an ordinary Internet client cannot access the site or SCM. A private-endpoint route and a health response are different checks.

## Sources

- [Disable basic authentication; Azure CLI Entra fallback](https://learn.microsoft.com/en-us/azure/app-service/configure-basic-auth-disable#deploy-without-basic-authentication)
- [ZIP package structure and deployment](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip)
- [Private endpoints and SCM DNS](https://learn.microsoft.com/en-us/azure/app-service/overview-private-endpoint#kuduscm-endpoint)
- [Configure Node.js on App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs)
