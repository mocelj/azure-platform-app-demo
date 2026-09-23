# Web App sample

This dependency-free Node application provides a simple HTTP response for testing
the Web App hosting and release path. It uses no Azure SDK or database and
contains no authentication or business logic.

From this directory, using Node `24.18.0` and npm `11.16.0`:

```powershell
npm ci --ignore-scripts
npm test
npm run check
npm start
```

In another terminal:

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3000/healthz
```

`PORT` overrides the default `3000`. The server listens on all interfaces so
App Service can reach it. GET and HEAD are supported; unknown routes return 404
and other methods return 405. `/healthz` is a process health check, not a test of
Azure dependencies.

App Service uses `NODE|24-lts` and manages its patches, so the Azure patch version
may differ from the local toolchain. The [release guide](../../docs/web-app-payload.md)
covers ZIP packaging and deployment through private SCM with Entra authentication.
Container App uses a separate catalog-pinned image rather than this source.
