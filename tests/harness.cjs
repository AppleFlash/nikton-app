const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const storeKey = 'nikton.marks.v1';
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 9, 17, 12])); }
}

function start(marks = {}, options = {}) {
  const nodes = new Map(), storage = new Map([[storeKey, JSON.stringify(marks)]]), confirmations = [];
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: '', firstChild: null, listeners: {},
        addEventListener(name, fn) { this.listeners[name] = fn; }
      });
      return nodes.get(id);
    },
    addEventListener() {}
  };
  const window = {
    localStorage: {
      getItem: key => storage.get(key),
      setItem(key, value) { if (options.failSave) throw Error('Storage unavailable'); storage.set(key, value); }
    },
    confirm(message) { confirmations.push(message); return options.confirm !== false; }
  };
  vm.runInNewContext(source, { document, window, Date: FixedDate, location: { search: '?splash=0' }, URLSearchParams, setTimeout: fn => fn() });
  const html = (id = 'main') => document.getElementById(id).innerHTML;
  const settle = () => new Promise(setImmediate);
  return {
    html, settle, confirmations,
    text: () => html().replace(/<[^>]*>/g, ' '),
    disabled(attribute, value) {
      const tag = [...html().matchAll(/<button\b([^>]*)>/g)].find(match => match[1].includes(`${attribute}="${value}"`));
      assert.ok(tag, `Missing button ${attribute}=${value}`);
      return /\bdisabled\b/.test(tag[1]);
    },
    days: () => [...html().matchAll(/data-day="([^"]+)"/g)].map(match => match[1]),
    marks: () => JSON.parse(storage.get(storeKey)),
    click(dataset) { document.getElementById('app').listeners.click({ target: { closest: () => ({ dataset, disabled: false }) } }); },
    swipeBack() {
      const target = { closest: () => ({}) }, handlers = document.getElementById('app').listeners;
      handlers.pointerdown({ target, clientX: 40, clientY: 100 });
      handlers.pointerup({ target, clientX: 140, clientY: 100 });
    },
    async importFile(file) {
      document.getElementById('importInput').listeners.change({ target: { files: file ? [file] : [] } });
      await settle();
    }
  };
}

module.exports = { start };
