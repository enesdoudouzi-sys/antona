const test = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../storage.js');

function profile(id = 1, name = 'Mia') {
  return { id, name, av: '🦊', stats: { stars: 4, best: { math: 2 }, history: {}, unlocked: [] } };
}

test('loads JSON and returns fallback for missing or malformed entries', () => {
  const data = new Map([['ok', '{"stars":3}'], ['bad', '{']]);
  const fake = { getItem: key => data.has(key) ? data.get(key) : null };
  assert.deepEqual(storage.load('ok', {}, fake), { stars: 3 });
  assert.deepEqual(storage.load('missing', [], fake), []);
  assert.equal(storage.load('bad', 'fallback', fake), 'fallback');
});

test('reports storage write failures instead of hiding them', () => {
  assert.equal(storage.save('key', { value: 1 }, { setItem() { throw new Error('quota'); } }), false);
  const data = new Map();
  assert.equal(storage.save('key', { value: 1 }, { setItem: (key, value) => data.set(key, value) }), true);
  assert.equal(data.get('key'), '{"value":1}');
});

test('encodes and decodes a versioned backup with Unicode names', () => {
  const profiles = [profile(2, 'Özlem 🌟')];
  const code = storage.encodeBackup(profiles);
  assert.deepEqual(storage.decodeBackup(code), profiles);
});

test('continues to accept legacy array backups', () => {
  const legacy = Buffer.from(JSON.stringify([profile()]), 'utf8').toString('base64');
  assert.deepEqual(storage.decodeBackup(legacy), [profile()]);
});

test('rejects malformed, unsafe, oversized, and structurally invalid backups', () => {
  assert.throws(() => storage.decodeBackup('not a backup'));
  assert.throws(() => storage.decodeBackup('A'.repeat(2 * 1024 * 1024 + 1)));
  assert.throws(() => storage.encodeBackup([{ ...profile(), av: '<img src=x>' }]));
  assert.throws(() => storage.encodeBackup([{ ...profile(), stats: 'broken' }]));
  assert.throws(() => storage.encodeBackup([profile(1), profile('1', 'Max')]));
  assert.throws(() => storage.encodeBackup([{ ...profile(), name: 'A name that is too long' }]));
  const invalid = Buffer.from(JSON.stringify([{ ...profile(), stats: { best: [] } }]), 'utf8').toString('base64');
  assert.throws(() => storage.decodeBackup(invalid));
});
