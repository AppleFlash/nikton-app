const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const storeKey = 'nikton.marks.v1';
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 9, 17, 12])); }
}

function start(marks = {}) {
  const nodes = new Map(), handlers = {}, storage = new Map([[storeKey, JSON.stringify(marks)]]);
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { innerHTML: '', firstChild: null, addEventListener() {} });
      return nodes.get(id);
    },
    addEventListener() {}
  };
  document.getElementById('app').addEventListener = (name, fn) => { handlers[name] = fn; };
  const window = { localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } };
  vm.runInNewContext(source, { document, window, Date: FixedDate, location: { search: '?splash=0' }, URLSearchParams, setTimeout: fn => fn() });
  const html = () => document.getElementById('main').innerHTML;
  return {
    text: () => html().replace(/<[^>]*>/g, ' '),
    disabled(attribute, value) {
      const tag = [...html().matchAll(/<button\b([^>]*)>/g)].find(match => match[1].includes(`${attribute}="${value}"`));
      assert.ok(tag, `Missing button ${attribute}=${value}`);
      return /\bdisabled\b/.test(tag[1]);
    },
    days: () => [...html().matchAll(/data-day="([^"]+)"/g)].map(match => match[1]),
    marks: () => JSON.parse(storage.get(storeKey)),
    click(dataset) { handlers.click({ target: { closest: () => ({ dataset, disabled: false }) } }); },
    swipeBack() {
      const target = { closest: () => ({}) };
      handlers.pointerdown({ target, clientX: 40, clientY: 100 });
      handlers.pointerup({ target, clientX: 140, clientY: 100 });
    }
  };
}

const empty = start();
assert.equal(empty.disabled('data-act', 'prev'), true, 'Empty history starts at the current month');
empty.swipeBack();
assert.match(empty.text(), /Октябрь 2026/);
empty.click({ act: 'next' });
assert.equal(empty.disabled('data-act', 'prev'), false);
empty.click({ act: 'prev' });
empty.click({ act: 'prev' });
assert.match(empty.text(), /Октябрь 2026/);

const history = { '2026-08-01': 'clean', '2025-12-05': 'smoked', '2026-01-20': 'clean' };
const months = start(history);
for (let i = 0; i < 10; i++) months.click({ act: 'prev' });
assert.match(months.text(), /Декабрь 2025/);
assert.equal(months.disabled('data-act', 'prev'), true);
months.swipeBack();
assert.match(months.text(), /Декабрь 2025/);

const years = start(history);
years.click({ view: 'year' });
years.click({ act: 'prev' });
assert.equal(years.disabled('data-act', 'prev'), true);
assert.equal(years.disabled('data-month', '0'), true, 'Year tiles cannot open a month before history');
assert.equal(years.disabled('data-month', '11'), false);
years.click({ month: '0' });
assert.match(years.text(), /Декабрь 2025/, 'Direct month selection is clamped to history');

const weeks = start({ '2026-09-14': 'clean' });
weeks.click({ view: 'week' });
for (let i = 0; i < 6; i++) weeks.click({ act: 'prev' });
assert.equal(weeks.days()[0], '2026-08-31', 'Keep the partial week containing September 1');
assert.equal(weeks.disabled('data-act', 'prev'), true);
assert.equal(weeks.disabled('data-day', '2026-08-31'), true);
assert.equal(weeks.disabled('data-day', '2026-09-01'), false);
weeks.swipeBack();
assert.equal(weeks.days()[0], '2026-08-31');

const removed = start({ '2026-09-14': 'clean', '2026-10-01': 'smoked' });
removed.click({ act: 'prev' });
removed.click({ day: '2026-09-14' });
removed.click({ act: 'clearMark' });
assert.match(removed.text(), /Октябрь 2026/, 'Removing the oldest mark updates the boundary');
assert.equal(removed.disabled('data-act', 'prev'), true);
assert.deepEqual(removed.marks(), { '2026-10-01': 'smoked' });

console.log('PASS: empty history, month and year boundaries, swipes, partial weeks, oldest mark removal.');
