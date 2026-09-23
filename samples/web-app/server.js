import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function parsePort(value = '3000') {
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  return Number(value);
}

export function createApp() {
  return createServer((request, response) => {
    const path = request.url.split('?')[0];
    let status = 200;
    let body;
    if (!['GET', 'HEAD'].includes(request.method)) {
      status = 405;
      body = { error: 'Method not allowed' };
      response.setHeader('Allow', 'GET, HEAD');
    } else if (path === '/') {
      body = { message: 'Hello from the platform app demo.', version: '0.1.0' };
    } else if (path === '/healthz') {
      body = { status: 'ok' };
    } else {
      status = 404;
      body = { error: 'Not found' };
    }
    const payload = `${JSON.stringify(body)}\n`;
    response.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : payload);
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const port = parsePort(process.env.PORT);
    const server = createApp();
    server.on('error', (error) => {
      console.error(`HTTP server could not start (${error.code ?? 'unknown error'}).`);
      process.exitCode = 1;
    });
    server.listen(port, '0.0.0.0', () => {
      console.log(`Platform demo listening on port ${port}.`);
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => server.close());
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
