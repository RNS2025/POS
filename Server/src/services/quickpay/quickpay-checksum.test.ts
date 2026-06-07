import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeQuickpayChecksum,
  verifyQuickpayChecksum,
} from './quickpay-checksum.js';
import {
  mapQuickpayToStatuses,
  merchantIdsMatch,
} from '../webhook/quickpay-webhook-logic.js';

describe('Quickpay checksum', () => {
  it('computes and verifies HMAC-SHA256 on raw body', () => {
    const body = '{"id":1,"merchant_id":5}';
    const key = 'test-private-key';
    const checksum = computeQuickpayChecksum(body, key);
    assert.equal(verifyQuickpayChecksum(body, key, checksum), true);
    assert.equal(verifyQuickpayChecksum(body, key, 'wrong'), false);
  });

  it('rejects tampered body', () => {
    const body = '{"id":1}';
    const key = 'test-private-key';
    const checksum = computeQuickpayChecksum(body, key);
    assert.equal(verifyQuickpayChecksum('{"id":2}', key, checksum), false);
  });
});

describe('Quickpay webhook logic', () => {
  it('matches merchant ids as strings', () => {
    assert.equal(merchantIdsMatch('12345', 12345), true);
    assert.equal(merchantIdsMatch('12345', 99999), false);
  });

  it('maps capture to captured status', () => {
    const result = mapQuickpayToStatuses({
      id: 1,
      merchant_id: 5,
      order_id: 'abc',
      operations: [{ id: 1, type: 'capture', qp_status_code: '20000', pending: false }],
    });
    assert.equal(result.orderStatus, 'captured');
    assert.equal(result.paymentStatus, 'captured');
  });

  it('maps failed payment', () => {
    const result = mapQuickpayToStatuses({
      id: 1,
      merchant_id: 5,
      order_id: 'abc',
      accepted: false,
      state: 'rejected',
    });
    assert.equal(result.orderStatus, 'failed');
  });

  it('maps cancelled payment', () => {
    const result = mapQuickpayToStatuses({
      id: 1,
      merchant_id: 5,
      order_id: 'abc',
      state: 'cancelled',
    });
    assert.equal(result.orderStatus, 'cancelled');
  });

  it('maps refund to partially_refunded', () => {
    const result = mapQuickpayToStatuses(
      {
        id: 1,
        merchant_id: 5,
        order_id: 'abc',
        operations: [{ id: 1, type: 'refund', qp_status_code: '20000', pending: false, amount: 5000 }],
      },
      0,
      10000,
    );
    assert.equal(result.orderStatus, 'partially_refunded');
    assert.equal(result.refundedAmountOre, 5000);
  });

  it('maps full refund', () => {
    const result = mapQuickpayToStatuses(
      {
        id: 1,
        merchant_id: 5,
        order_id: 'abc',
        operations: [{ id: 1, type: 'refund', qp_status_code: '20000', pending: false, amount: 10000 }],
      },
      0,
      10000,
    );
    assert.equal(result.orderStatus, 'refunded');
  });
});
