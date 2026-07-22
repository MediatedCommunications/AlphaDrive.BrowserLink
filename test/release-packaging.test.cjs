const assert = require('node:assert/strict');
const test = require('node:test');

const { assertVersion, nextVersion } = require('../updateVersionAndZip.cjs');

test('nextVersion starts a new date at build 001', () => {
  assert.equal(
    nextVersion('25.10.09.001', new Date(2026, 6, 22)),
    '26.7.22.1'
  );
});

test('nextVersion increments an existing build on the same date', () => {
  assert.equal(
    nextVersion('26.7.22.9', new Date(2026, 6, 22)),
    '26.7.22.10'
  );
});

test('assertVersion rejects versions outside the release format', () => {
  assert.throws(() => assertVersion('26.07.22.001'), /Invalid extension version/);
  assert.throws(() => assertVersion('26.7.22.65536'), /Invalid extension version/);
  assert.throws(() => assertVersion('0.0.0.0'), /Invalid extension version/);
  assert.doesNotThrow(() => assertVersion('26.7.22.1'));
});
