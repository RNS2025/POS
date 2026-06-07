import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allowedActions,
  assertActionAllowed,
  getRefundableAmountOre,
  refundStatusesAfterAmount,
  type OrderPaymentContext,
} from '../domain/payment-actions.js';

function ctx(overrides: Partial<OrderPaymentContext>): OrderPaymentContext {
  return {
    channel: 'online',
    orderStatus: 'pending',
    paymentStatus: 'pending',
    amountOre: 10000,
    refundedAmountOre: 0,
    orderCreatedAt: new Date(),
    paymentUpdatedAt: new Date(),
    verifonePoiTransactionId: null,
    ...overrides,
  };
}

describe('payment action guards', () => {
  it('allows retry for failed online order', () => {
    const actions = allowedActions(ctx({ orderStatus: 'failed', paymentStatus: 'failed' }));
    assert.ok(actions.includes('retry'));
  });

  it('allows retry for cancelled online order', () => {
    const actions = allowedActions(ctx({ orderStatus: 'cancelled', paymentStatus: 'failed' }));
    assert.ok(actions.includes('retry'));
  });

  it('allows refund for captured online order', () => {
    const actions = allowedActions(
      ctx({ orderStatus: 'captured', paymentStatus: 'captured', amountOre: 5000 }),
    );
    assert.ok(actions.includes('refund'));
  });

  it('allows partial refund when partially refunded', () => {
    const actions = allowedActions(
      ctx({
        orderStatus: 'partially_refunded',
        paymentStatus: 'partially_refunded',
        amountOre: 10000,
        refundedAmountOre: 3000,
      }),
    );
    assert.ok(actions.includes('refund'));
    assert.equal(getRefundableAmountOre(ctx({ amountOre: 10000, refundedAmountOre: 3000 })), 7000);
  });

  it('allows terminal retry on failed', () => {
    const actions = allowedActions(
      ctx({ channel: 'terminal', orderStatus: 'failed', paymentStatus: 'failed' }),
    );
    assert.ok(actions.includes('retry'));
  });

  it('allows abort for pending terminal sale', () => {
    const actions = allowedActions(
      ctx({ channel: 'terminal', orderStatus: 'pending', paymentStatus: 'pending' }),
    );
    assert.ok(actions.includes('abort'));
  });

  it('allows void for recent captured terminal sale with POI id', () => {
    const actions = allowedActions(
      ctx({
        channel: 'terminal',
        orderStatus: 'captured',
        paymentStatus: 'captured',
        verifonePoiTransactionId: 'poi-123',
        paymentUpdatedAt: new Date(),
      }),
    );
    assert.ok(actions.includes('void'));
  });

  it('rejects disallowed action', () => {
    assert.throws(
      () => assertActionAllowed('refund', ctx({ orderStatus: 'failed', paymentStatus: 'failed' })),
      /not allowed/,
    );
  });

  it('computes refund statuses', () => {
    const partial = refundStatusesAfterAmount(3000, 0, 10000);
    assert.equal(partial.orderStatus, 'partially_refunded');

    const full = refundStatusesAfterAmount(7000, 3000, 10000);
    assert.equal(full.orderStatus, 'refunded');
  });
});
