const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { start } = require('./harness.cjs');

const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/history-v1.json'), 'utf8');
const expected = JSON.parse(fixture).marks;
const original = { '2026-10-10': 'smoked' };
const file = text => new File([text], 'history.json', { type: 'application/json' });
const open = options => { const app = start(original, options); app.click({ act: 'openData' }); return app; };

(async () => {
  const imported = open();
  await imported.importFile(file(fixture));
  assert.deepEqual(imported.marks(), expected, 'Import must replace and persist the complete history');
  assert.equal(imported.confirmations.length, 1);
  assert.match(imported.confirmations[0], /заменена/);
  assert.match(imported.html('data'), />14 отметок · файл \.json</);

  const cancelled = open({ confirm: false });
  await cancelled.importFile(file(fixture));
  assert.deepEqual(cancelled.marks(), original, 'Cancelled import must preserve history');
  assert.equal(cancelled.confirmations.length, 1);

  const invalid = [
    '{broken', 'null', '[]',
    JSON.stringify({ version: 2, marks: {} }),
    JSON.stringify({ version: 1, marks: [] }),
    JSON.stringify({ version: 1, marks: null }),
    ...['2026-02-30', '2025-02-29', '2026-1-01', '2026-10-18', '__proto__'].map(date =>
      JSON.stringify({ version: 1, marks: { [date]: 'clean' } })),
    JSON.stringify({ version: 1, marks: { '2026-10-01': 'unknown' } })
  ];
  for (const text of invalid) {
    const app = open();
    await app.importFile(file(text));
    assert.deepEqual(app.marks(), original, `Invalid import changed history: ${text}`);
    assert.equal(app.confirmations.length, 0, 'Validate before asking to replace history');
    assert.match(app.html('data'), /role="alert"/);
  }

  const oversized = open();
  await oversized.importFile({ name: 'large.json', size: 5 * 1024 * 1024 + 1, text() { assert.fail('Oversized file must not be read'); } });
  assert.deepEqual(oversized.marks(), original);
  assert.match(oversized.html('data'), /role="alert"/);

  const unreadable = open();
  await unreadable.importFile({ name: 'unreadable.json', size: 1, text: () => Promise.reject(Error('Read failed')) });
  assert.deepEqual(unreadable.marks(), original);
  assert.match(unreadable.html('data'), /role="alert"/);

  const failedSave = open({ failSave: true });
  await failedSave.importFile(file(fixture));
  assert.deepEqual(failedSave.marks(), original);
  failedSave.click({ act: 'openData' });
  assert.match(failedSave.html('data'), />1 отметка · файл \.json</, 'Failed save must also preserve the in-memory history');

  const cleared = open();
  await cleared.importFile(file('{"version":1,"marks":{}}'));
  assert.deepEqual(cleared.marks(), {});
  assert.equal(cleared.confirmations.length, 1, 'Clearing history requires confirmation');

  const bom = open();
  await bom.importFile(file('\uFEFF' + fixture));
  assert.deepEqual(bom.marks(), expected);

  const concurrent = open();
  let release;
  await concurrent.importFile({ name: 'first.json', size: fixture.length, text: () => new Promise(resolve => { release = resolve; }) });
  await concurrent.importFile(file('{"version":1,"marks":{}}'));
  release(fixture);
  await concurrent.settle();
  assert.deepEqual(concurrent.marks(), expected, 'A second file cannot overwrite a pending import');
  assert.equal(concurrent.confirmations.length, 1);

  for (const action of ['markClean', 'clearMark']) {
    const app = start(original, { failSave: true });
    app.click({ day: '2026-10-10' });
    app.click({ act: action });
    assert.deepEqual(app.marks(), original);
    assert.match(app.html('data'), /role="alert"/);
  }

  console.log('PASS: import, validation, confirmation, read/write errors, empty file, BOM, concurrent imports.');
})().catch(error => { console.error(error); process.exitCode = 1; });
