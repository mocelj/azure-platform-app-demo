# Security policy

This public repository holds example configuration and application source.
Deployment privileges and environment bindings remain in the catalog's operating
environment. The release has passed CI, but Azure deployment and network
verification have not been performed.

PR validation uses hosted runners without Azure credentials, deployment OIDC,
or private-runner access. Keep real customer identifiers, private environment
bindings, SSH private keys, state, and saved plans out of this repository.

Catalog plan and apply accept a full consumer SHA already merged into `main`.
They retrieve and revalidate JSON rather than execute PR scripts, workflows,
IaC, install hooks, or application source on the private runner. Premerge Azure
preview is not supported. The [walkthrough](docs/walkthrough.md) and
[application release guide](docs/web-app-payload.md) describe the two paths.

To report a vulnerability, use **Security → Report a vulnerability** if enabled.
Otherwise, contact `mocelj` to arrange a private channel before sharing details.
Include the commit, target, and a reproduction using test data, without live
secrets or customer information.

The sample has no application authentication or business-data controls; private
ingress alone does not provide them. Original code is provided under [MIT](LICENSE).
The [catalog security policy](https://github.com/mocelj/azure-platform-catalog/blob/main/SECURITY.md)
covers deployment controls and the additional considerations for production or
regulated use.
