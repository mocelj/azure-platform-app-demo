# Releasing the Web App application

The catalog provisions App Service; application content is built and released
separately. That separation prevents PR code, install hooks, and deployment
scripts from running with infrastructure credentials.

This guide packages the sample and deploys it over private SCM using Entra
authentication. Basic publishing and public access stay disabled. The path has
not yet been exercised against a live Azure deployment.

## Runtime and startup

The dependency-free [sample](../samples/web-app/README.md), version `0.1.0`, uses
Node `24.18.0` and npm `11.16.0` for local tests. It starts with `node server.js`
and uses App Service's `PORT`.

App Service uses the Linux `NODE|24-lts` family and manages its patches.
`engines.node` records the development/test version, not a fixed Azure binary.
Verify the runtime during deployment preparation. A requirement to control the
runtime image byte-for-byte would call for a digest-pinned container and a
corresponding image lifecycle process.

Both infrastructure implementations configure `node server.js` and route outbound
traffic through VNet integration (`outboundVnetRouting.allTraffic = true`).
They do not upload application content.

The sample returns no environment details and has no external dependencies,
authentication, or business-data controls. `/healthz` checks the HTTP process
rather than downstream services.

## Build and package

Build a reviewed application commit in an isolated environment without Azure
deployment credentials. From the consumer root in PowerShell 7:

```powershell
Set-Location samples\web-app
npm ci --ignore-scripts
npm test
npm run check
New-Item -ItemType Directory -Force out | Out-Null
Compress-Archive -Path server.js,package.json,package-lock.json -DestinationPath out\web-app-0.1.0.zip -Force
Get-FileHash out\web-app-0.1.0.zip -Algorithm SHA256
```

The ZIP has the three runtime files at its root rather than an enclosing repository
directory. Keep the commit, SHA-256, sample version, test results, and release
approval together. Transfer the artifact through the release process, not an
arbitrary download URL supplied to the infrastructure runner.

Review the archive and manifest before promotion, particularly changes to
dependencies, startup, `.deployment`, or other executable hooks. This sample
needs no server-side restore or build, so `SCM_DO_BUILD_DURING_DEPLOYMENT` stays
disabled.

## Deploy through private SCM

The Web App must already exist. Use its resource group and app name from the
deployment outputs. The release identity needs app-scoped publish permissions;
infrastructure deployment rights and application-release rights should be
considered separately.

The release host needs Azure CLI `2.88.0`, short-lived Entra authentication, and
private DNS/TCP access to both `<app>.azurewebsites.net` and
`<app>.scm.azurewebsites.net`. It does not need publishing profiles, FTP, SAS,
client secrets, or a persistent subscription Owner identity. Keep site/SCM TLS,
basic-publishing, and public-access settings unchanged.

After transferring the ZIP to the private release host, verify its digest and deploy:

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

The DNS results should end at the site's private endpoint address. These DNS/TCP
commands are Windows-specific; use equivalent tools on Linux. Keep tokens and
Azure CLI debug traces out of public logs.

Microsoft supports Entra fallback for `az webapp deploy` with basic publishing
disabled from Azure CLI 2.48.1 onward. The pinned `2.88.0` meets that requirement.
If deployment fails, check federation, publish permissions, DNS, and routes while
retaining the access settings. Live authorization and SCM connectivity still need
to be verified in your environment.

Retain the release result separately from sensitive raw logs. Test both the
private application response and denial from an Internet client, including SCM:
successful private access alone does not verify public-access restrictions.

## Sources

- [Disable basic authentication; Azure CLI Entra fallback](https://learn.microsoft.com/en-us/azure/app-service/configure-basic-auth-disable#deploy-without-basic-authentication)
- [ZIP package structure and deployment](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip)
- [Private endpoints and SCM DNS](https://learn.microsoft.com/en-us/azure/app-service/overview-private-endpoint#kuduscm-endpoint)
- [Configure Node.js on App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs)
