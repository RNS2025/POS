import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateQuickpayOrderRef } from './quickpay-order-ref.js';

describe('Quickpay order ref', () => {
  it('generates refs within Quickpay 4–20 character limit', () => {
    for (let i = 0; i < 20; i++) {
      const ref = generateQuickpayOrderRef();
      assert.ok(ref.length >= 4 && ref.length <= 20, `ref length ${ref.length}: ${ref}`);
      assert.match(ref, /^[a-f0-9]+$/);
    }
  });
});
