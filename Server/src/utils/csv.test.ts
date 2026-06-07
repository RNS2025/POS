import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { csvEscape, toCsvRow } from './csv.js';

describe('CSV export', () => {
  it('escapes commas and quotes', () => {
    assert.equal(csvEscape('hello'), 'hello');
    assert.equal(csvEscape('a,b'), '"a,b"');
    assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
  });

  it('builds rows', () => {
    assert.equal(toCsvRow(['Shop', 'acme']), 'Shop,acme');
    assert.equal(toCsvRow(['A,B', 'x']), '"A,B",x');
  });
});
