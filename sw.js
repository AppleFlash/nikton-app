'use strict';

const PREFIX = 'nikton-pwa:' + self.registration.scope + ':';
const CACHE = PREFIX + 'v3';
const FILES = [
  'index.html', 'styles.css', 'app.js', 'nikton.js', 'pwa.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'fonts/fonts.css', 'fonts/manrope-cyrillic.woff2', 'fonts/manrope-latin.woff2',
  'fonts/unbounded-cyrillic.woff2', 'fonts/unbounded-latin.woff2'
].concat([
  'a01', 'a02', 'a03', 'a04', 'a05', 'a07', 'a08', 'a09', 'a10',
  'b01', 'b02', 'b03', 'b04', 'b05', 'b06',
  'c01', 'c02', 'c03', 'c04', 'c05',
  'd01', 'd02', 'd03', 'd04', 'd05', 'd06', 'd07',
  'e01', 'e02', 'e03', 'e04', 'e05', 'e06', 'e07', 'e08', 'e10', 'e11',
  'eb-l', 'eb-r', 'ec-l', 'ec-r', 'ed-l', 'ed-r',
  'f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08', 'f09', 'f10', 'f11'
].map(frame => 'assets/' + frame + '.webp')).map(file => new URL(file, self.registration.scope).href);
const RESOURCES = new Set(FILES);
const INDEX = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const resource = url.origin + url.pathname;
  const key = request.mode === 'navigate' && resource === self.registration.scope ? INDEX : resource;
  if (!RESOURCES.has(key)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(key)).then(response => response || fetch(request)));
});
