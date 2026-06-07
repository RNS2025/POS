import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Order, Payment } from '../../generated/prisma/client.js';
import type { IOrderRepository } from '../../repositories/order.repository.js';
import type { ITenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import type { IQuickpayClient } from './quickpay.client.js';
import { QuickpaySyncService } from './quickpay-sync.service.js';
import { mapQuickpayToStatuses } from '../webhook/quickpay-webhook-logic.js';

describe('Quickpay sync status mapping', () => {
  it('maps processed payment to captured for sync', () => {
    const result = mapQuickpayToStatuses({
      id: 599895319,
      merchant_id: 12345,
      order_id: 'abc123',
      state: 'processed',
      operations: [
        { id: 1, type: 'authorize', qp_status_code: '20000', pending: false },
        { id: 2, type: 'capture', qp_status_code: '20000', pending: false },
      ],
    });
    assert.equal(result.orderStatus, 'captured');
    assert.equal(result.paymentStatus, 'captured');
  });
});

describe('QuickpaySyncService cooldown', () => {
  const tenantId = 'tenant-1';
  const orderId = 'order-1';
  const paymentId = 'payment-1';

  function makeOrder(overrides: Partial<Payment> = {}): Order & { payment: Payment | null } {
    return {
      id: orderId,
      tenantId,
      channel: 'online',
      quickpayOrderRef: 'ref123',
      amountOre: 10000,
      currency: 'DKK',
      status: 'pending',
      customerEmail: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      payment: {
        id: paymentId,
        tenantId,
        orderId,
        channel: 'online',
        quickpayPaymentId: 42,
        quickpayMerchantId: '12345',
        verifoneTransactionId: null,
        verifonePoiTransactionId: null,
        verifonePoiTimestamp: null,
        poiId: null,
        status: 'pending',
        amountOre: 10000,
        refundedAmountOre: 0,
        paymentLinkUrl: null,
        currency: 'DKK',
        lastQuickpaySyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      },
    };
  }

  it('skips Quickpay fetch when synced recently and not forced', async () => {
    let fetchCalls = 0;
    const orders: IOrderRepository = {
      findByIdForTenant: async () =>
        makeOrder({ lastQuickpaySyncAt: new Date() }),
      create: async () => {
        throw new Error('not used');
      },
      updateStatus: async () => undefined,
      listForTenant: async () => ({ items: [], total: 0 }),
    };
    const quickpayConfigs: ITenantQuickpayConfigRepository = {
      findByTenantId: async () => {
        throw new Error('should not load config during cooldown');
      },
      upsert: async () => {
        throw new Error('not used');
      },
      updatePing: async () => undefined,
    };
    const quickpay: IQuickpayClient = {
      fetchPayment: async () => {
        fetchCalls += 1;
        return null;
      },
      createPaymentLink: async () => {
        throw new Error('not used');
      },
      refreshPaymentLink: async () => {
        throw new Error('not used');
      },
      ping: async () => ({ ok: true }),
      refundPayment: async () => ({ ok: true }),
      buildWebhookUrl: () => '',
    };

    const service = new QuickpaySyncService(orders, quickpayConfigs, quickpay);
    const result = await service.syncOrderFromQuickpay(tenantId, orderId);

    assert.equal(fetchCalls, 0);
    assert.equal(result.synced, false);
    assert.equal(result.orderStatus, 'pending');
  });

  it('calls Quickpay fetch when force is true despite recent sync', async () => {
    let fetchCalls = 0;
    const orders: IOrderRepository = {
      findByIdForTenant: async () =>
        makeOrder({ lastQuickpaySyncAt: new Date() }),
      create: async () => {
        throw new Error('not used');
      },
      updateStatus: async () => undefined,
      listForTenant: async () => ({ items: [], total: 0 }),
    };
    const quickpayConfigs: ITenantQuickpayConfigRepository = {
      findByTenantId: async () => ({
        tenantId,
        merchantId: '12345',
        apiKeyEnc: 'enc',
        privateKeyEnc: 'enc',
        lastPingOk: true,
        lastPingAt: new Date(),
        lastPingError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      upsert: async () => {
        throw new Error('not used');
      },
      updatePing: async () => undefined,
    };
    const quickpay: IQuickpayClient = {
      fetchPayment: async () => {
        fetchCalls += 1;
        throw new Error('fetch reached');
      },
      createPaymentLink: async () => {
        throw new Error('not used');
      },
      refreshPaymentLink: async () => {
        throw new Error('not used');
      },
      ping: async () => ({ ok: true }),
      refundPayment: async () => ({ ok: true }),
      buildWebhookUrl: () => '',
    };

    const service = new QuickpaySyncService(orders, quickpayConfigs, quickpay);
    await assert.rejects(
      () => service.syncOrderFromQuickpay(tenantId, orderId, { force: true }),
      /fetch reached/,
    );
    assert.equal(fetchCalls, 1);
  });
});
