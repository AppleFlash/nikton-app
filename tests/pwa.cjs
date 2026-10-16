const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file));

async function check(scope) {
  const listeners = {}, stored = new Map(), deleted = [];
  let cacheName, claimed = false, network = 0;
  const cache = {
    async addAll(requests) {
      for (const request of requests) {
        assert.equal(request.cache, 'reload', 'Installation must bypass stale HTTP resources');
        assert.ok(request.url.startsWith(scope));
        stored.set(request.url, new Response(read(decodeURI(request.url.slice(scope.length)))));
      }
    },
    async match(key) { return stored.get(key)?.clone(); }
  };
  vm.runInNewContext(read('sw.js').toString(), {
    self: {
      registration: { scope }, location: new URL('sw.js', scope),
      clients: { async claim() { claimed = true; } },
      addEventListener(name, handler) { listeners[name] = handler; }
    },
    URL, Request,
    caches: {
      async open(name) { cacheName = name; return cache; },
      async keys() { return [cacheName, cacheName + '-old', 'another-app-v1', 'nikton-pwa:https://other.test/:v1']; },
      async delete(name) { deleted.push(name); }
    },
    async fetch() { network++; throw Error('Offline'); }
  });
  let pending;
  listeners.install({ waitUntil(promise) { pending = promise; } });
  await pending;
  const html = read('index.html').toString();
  const dependencies = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  dependencies.push(...fs.readdirSync(path.join(root, 'assets')).filter(f => f.endsWith('.webp')).map(f => 'assets/' + f));
  dependencies.push(...fs.readdirSync(path.join(root, 'fonts')).filter(f => f.endsWith('.woff2')).map(f => 'fonts/' + f));
  for (const file of dependencies) assert.ok(stored.has(new URL(file, scope).href), 'Missing offline resource: ' + file);
  const get = async (file, mode = 'cors', method = 'GET') => {
    let response;
    listeners.fetch({ request: { url: new URL(file, scope).href, method, mode }, respondWith(promise) { response = promise; } });
    return response;
  };
  for (const file of ['./', './?splash=0', 'index.html?splash=0']) {
    assert.equal(await (await get(file, 'navigate')).text(), html, 'Offline navigation must load the app');
  }
  assert.equal(await (await get('styles.css?v=1')).text(), read('styles.css').toString());
  assert.equal(await get('not-found.webp'), undefined, 'Unknown assets must not receive HTML');
  assert.equal(await get('app.js', 'cors', 'POST'), undefined);
  assert.equal(await get('https://other.test/app.js'), undefined);
  assert.equal(network, 0, 'Cached application must work with no network');
  listeners.activate({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(deleted, [cacheName + '-old'], 'Only previous caches of this installation may be removed');
  assert.equal(claimed, true);
  cache.addAll = async () => { throw Error('Incomplete download'); };
  listeners.install({ waitUntil(promise) { pending = promise; } });
  await assert.rejects(pending, /Incomplete download/);
}

(async () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}`);
    assert.ok(icon, `Missing ${size}px install icon`);
    const png = read(icon.src);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  await check('https://example.test/');
  await check('https://example.test/nikton/');
  console.log('PASS: install icons, complete offline resources, offline navigation, subdirectory deployment, cache isolation, failed installation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
