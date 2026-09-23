import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp, parsePort } from '../server.js';

test('PORT defaults locally and rejects invalid configuration', () => {
  assert.equal(parsePort(), 3000);
  assert.equal(parsePort('8080'), 8080);
  assert.equal(parsePort('65535'), 65535);
  for (const value of ['', '0', '-1', '65536', '3.5', '3000junk', ' 3000', 'Infinity']) {
    assert.throws(() => parsePort(value), /PORT must be an integer/);
  }
});

test('HTTP contract: hello, health, HEAD, missing route, rejected method', async (context) => {
  const server = createApp();
  context.after(() => new Promise((resolveClose, reject) => {
    server.close((error) => error ? reject(error) : resolveClose());
    server.closeAllConnections();
  }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  const hello = await fetch(`${base}/`);
  assert.equal(hello.status, 200);
  assert.match(hello.headers.get('content-type'), /^application\/json/);
  assert.equal(hello.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await hello.json(), {
    message: 'Hello from the platform app demo.',
    version: '0.1.0'
  });

  const health = await fetch(`${base}/healthz?probe=1`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });

  const head = await fetch(`${base}/healthz`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.ok(Number(head.headers.get('content-length')) > 0);

  const missing = await fetch(`${base}/missing`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Not found' });

  const post = await fetch(`${base}/`, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
  assert.deepEqual(await post.json(), { error: 'Method not allowed' });
});
