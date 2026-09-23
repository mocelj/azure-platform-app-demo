# Web App hello-world

This dependency-free Node application is a payload, not an infrastructure deployment. It contains no customer data, credentials, database, authentication layer, or Azure SDK.

From this directory, with Node **24.18.0** and npm **11.16.0**:

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

`PORT` overrides the local default of `3000`; the server listens on all interfaces so App Service can reach it. GET and HEAD are supported. Unknown routes return 404; other methods return 405. `/healthz` proves only that this process responds, not that Azure dependencies work.

Azure uses **`NODE|24-lts`**, a platform-managed runtime family. It does **not** guarantee the local exact patch version. See [trusted payload deployment](../../docs/web-app-payload.md) for ZIP packaging, Entra authentication, private SCM access, and the separate release boundary. The Container App uses a different, catalog-pinned image; this source is not that image.
