import { config } from '../../infra/config.js';
import { decryptSecret } from '../../infra/crypto.js';
import type { ITenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import { mapQuickpayPingError } from './quickpay-errors.js';
import type { QuickpayCallbackPayment } from '../webhook/quickpay-webhook-logic.js';

export interface PaymentLinkInput {
  orderId: string;
  amountOre: number;
  currency: string;
  continueUrl: string;
  cancelUrl: string;
}

export interface PaymentLinkResult {
  quickpayPaymentId: number;
  paymentUrl: string;
  merchantId: string;
}

export interface IQuickpayClient {
  ping(tenantId: string): Promise<{ ok: boolean; error?: string }>;
  buildWebhookUrl(tenantId: string): string;
  createPaymentLink(tenantId: string, input: PaymentLinkInput): Promise<PaymentLinkResult>;
  refreshPaymentLink(
    tenantId: string,
    quickpayPaymentId: number,
    input: PaymentLinkInput,
  ): Promise<PaymentLinkResult>;
  refundPayment(
    tenantId: string,
    quickpayPaymentId: number,
    amountOre: number,
  ): Promise<{ ok: boolean; error?: string }>;
  fetchPayment(tenantId: string, quickpayPaymentId: number): Promise<QuickpayCallbackPayment | null>;
}

interface QuickpayPaymentResponse {
  id: number;
  merchant_id: number;
}

interface QuickpayLinkResponse {
  url: string;
}

export class QuickpayClient implements IQuickpayClient {
  constructor(
    private readonly configs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
  ) {}

  async ping(tenantId: string): Promise<{ ok: boolean; error?: string }> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      return {
        ok: false,
        error:
          'Quickpay is not set up yet. Enter your merchant number, private key, and payment window key, then click Save.',
      };
    }

    try {
      const response = await this.request(tenantId, 'GET', '/ping');
      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: mapQuickpayPingError(response.status, text) };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          'Could not connect to Quickpay. Check your internet connection and try Save again. ' +
          (err instanceof Error ? err.message : ''),
      };
    }
  }

  async createPaymentLink(tenantId: string, input: PaymentLinkInput): Promise<PaymentLinkResult> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      throw new Error('Quickpay is not configured for this shop.');
    }

    const createResponse = await this.request(tenantId, 'POST', '/payments', {
      currency: input.currency,
      order_id: input.orderId,
    });

    if (!createResponse.ok) {
      const text = await createResponse.text();
      throw new Error(mapQuickpayPingError(createResponse.status, text));
    }

    const payment = (await createResponse.json()) as QuickpayPaymentResponse;
    const paymentUrl = await this.putPaymentLink(tenantId, payment.id, input);

    return {
      quickpayPaymentId: payment.id,
      paymentUrl,
      merchantId: row.merchantId,
    };
  }

  async refreshPaymentLink(
    tenantId: string,
    quickpayPaymentId: number,
    input: PaymentLinkInput,
  ): Promise<PaymentLinkResult> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      throw new Error('Quickpay is not configured for this shop.');
    }

    const paymentUrl = await this.putPaymentLink(tenantId, quickpayPaymentId, input);

    return {
      quickpayPaymentId,
      paymentUrl,
      merchantId: row.merchantId,
    };
  }

  async refundPayment(
    tenantId: string,
    quickpayPaymentId: number,
    amountOre: number,
  ): Promise<{ ok: boolean; error?: string }> {
    const response = await this.request(tenantId, 'POST', `/payments/${quickpayPaymentId}/refund`, {
      amount: amountOre,
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: mapQuickpayPingError(response.status, text) };
    }

    return { ok: true };
  }

  async fetchPayment(
    tenantId: string,
    quickpayPaymentId: number,
  ): Promise<QuickpayCallbackPayment | null> {
    const response = await this.request(tenantId, 'GET', `/payments/${quickpayPaymentId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(mapQuickpayPingError(response.status, text));
    }
    return (await response.json()) as QuickpayCallbackPayment;
  }

  buildWebhookUrl(tenantId: string): string {
    return `${config.apiPublicUrl}/api/v1/webhooks/quickpay/${tenantId}`;
  }

  private async putPaymentLink(
    tenantId: string,
    quickpayPaymentId: number,
    input: PaymentLinkInput,
  ): Promise<string> {
    const callbackUrl = this.buildWebhookUrl(tenantId);

    const linkResponse = await this.request(
      tenantId,
      'PUT',
      `/payments/${quickpayPaymentId}/link`,
      {
        amount: input.amountOre,
        continue_url: input.continueUrl,
        cancel_url: input.cancelUrl,
        callback_url: callbackUrl,
        auto_capture: true,
        language: 'da',
      },
      { 'QuickPay-Callback-Url': callbackUrl },
    );

    if (!linkResponse.ok) {
      const text = await linkResponse.text();
      throw new Error(mapQuickpayPingError(linkResponse.status, text));
    }

    const link = (await linkResponse.json()) as QuickpayLinkResponse;
    return link.url;
  }

  private async request(
    tenantId: string,
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ) {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      throw new Error('Quickpay is not configured for this shop.');
    }

    const apiKey = decryptSecret(row.apiKeyEnc);
    const auth = Buffer.from(`:${apiKey}`).toString('base64');

    return fetch(`https://api.quickpay.net${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Accept-Version': 'v10',
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...extraHeaders,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }
}

export const quickpayClient = new QuickpayClient();
