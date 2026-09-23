# Security policy

This public consumer repository contains synthetic requests and illustrative application code. It is not production-ready or FSI-compliant, and passing its checks does not establish an Azure deployment.

Never add Azure credentials, OIDC permissions for deployment, private runners, real customer identifiers, SSH private keys, state, saved plans, or private environment bindings here. Public PR validation must remain credential-free and use hosted runners.

Both catalog plan and apply require an exact consumer SHA already merged into approved `main`; PR validation is offline only, with no premerge Azure preview. The catalog retrieves approved configuration as data and independently revalidates it. It does not execute PR scripts, workflows, IaC, payloads, install hooks, or arbitrary URLs on the private runner. See [the walkthrough](docs/walkthrough.md) and [trusted payload release](docs/web-app-payload.md).

To report a vulnerability, use **Security → Report a vulnerability** if private reporting is enabled. Otherwise, ask `mocelj` for a private channel without posting exploit details or sensitive information. Include the commit, target, and a synthetic reproduction. Do not submit live secrets or customer data.

The application sample has no authentication or business-data protection. Private ingress is not a replacement for application authorization. Original code is provided under [MIT](LICENSE), without a support or security warranty. The [catalog security policy](https://github.com/mocelj/azure-platform-catalog/blob/main/SECURITY.md) explains the broader trust boundary.
