import { randomInt } from 'node:crypto';
import { config } from '../../infra/config.js';
import { decryptSecret } from '../../infra/crypto.js';
import type { ITenantVerifoneConfigRepository } from '../../repositories/tenant-verifone-config.repository.js';
import { tenantVerifoneConfigRepository } from '../../repositories/tenant-verifone-config.repository.js';
import { generateQuickpayOrderRef } from '../quickpay/quickpay-order-ref.js';

export interface VerifoneSaleInput {
  transactionId: string;
  amountOre: number;
  currency: string;
}

export interface VerifonePoiTransaction {
  transactionId: string;
  timestamp: string;
}

export interface VerifoneSaleResult {
  ok: boolean;
  result: 'SUCCESS' | 'FAILURE';
  transactionId: string;
  poiTransaction?: VerifonePoiTransaction;
  error?: string;
}

export interface VerifoneRefundInput {
  transactionId: string;
  originalPoiTransaction: VerifonePoiTransaction;
  amountOre: number;
  currency: string;
}

export interface VerifoneReversalInput {
  transactionId: string;
  originalPoiTransaction: VerifonePoiTransaction;
  amountOre: number;
  currency: string;
  reason?: string;
}

export interface VerifoneSaleOptions {
  poiId?: string;
}

export interface IVerifoneClient {
  ping(tenantId: string): Promise<{ ok: boolean; error?: string }>;
  createSale(
    tenantId: string,
    input: VerifoneSaleInput,
    options?: VerifoneSaleOptions,
  ): Promise<VerifoneSaleResult>;
  refundSale(tenantId: string, input: VerifoneRefundInput): Promise<VerifoneSaleResult>;
  reverseSale(tenantId: string, input: VerifoneReversalInput): Promise<VerifoneSaleResult>;
  abortSale(tenantId: string, saleTransactionId: string): Promise<{ ok: boolean; error?: string }>;
}

interface VerifoneConfigRow {
  userUid: string;
  apiKeyEnc: string;
  poiId: string;
  saleId: string;
  useSimulator: boolean;
}

interface VerifonePaymentResponse {
  PaymentResponse?: {
    Response?: { Result?: string; ErrorCondition?: string | null };
    SaleData?: {
      SaleTransactionID?: { TransactionID?: string; TimeStamp?: string };
    };
    POIData?: {
      POITransactionID?: { TransactionID?: string; TimeStamp?: string | null };
    };
  };
}

export class VerifoneClient implements IVerifoneClient {
  constructor(
    private readonly configs: ITenantVerifoneConfigRepository = tenantVerifoneConfigRepository,
  ) {}

  async ping(tenantId: string): Promise<{ ok: boolean; error?: string }> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      return {
        ok: false,
        error: 'Verifone is not set up yet. Enter your terminal details in shop setup.',
      };
    }

    if (row.useSimulator || config.verifoneSimulator) {
      return { ok: true };
    }

    if (!row.userUid.trim() || !row.poiId.trim() || !row.saleId.trim()) {
      return { ok: false, error: 'Enter user UID, terminal ID (POIID), and sale ID.' };
    }

    try {
      decryptSecret(row.apiKeyEnc);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Saved Verifone API key could not be read. Save it again.' };
    }
  }

  async createSale(
    tenantId: string,
    input: VerifoneSaleInput,
    options?: VerifoneSaleOptions,
  ): Promise<VerifoneSaleResult> {
    return this.paymentRequest(tenantId, input, 'NORMAL', undefined, options?.poiId);
  }

  async refundSale(tenantId: string, input: VerifoneRefundInput): Promise<VerifoneSaleResult> {
    return this.paymentRequest(
      tenantId,
      {
        transactionId: input.transactionId,
        amountOre: input.amountOre,
        currency: input.currency,
      },
      'REFUND',
      input.originalPoiTransaction,
    );
  }

  async reverseSale(tenantId: string, input: VerifoneReversalInput): Promise<VerifoneSaleResult> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      return {
        ok: false,
        result: 'FAILURE',
        transactionId: input.transactionId,
        error: 'Verifone is not set up for this shop.',
      };
    }

    if (row.useSimulator || config.verifoneSimulator) {
      return {
        ok: true,
        result: 'SUCCESS',
        transactionId: input.transactionId,
        poiTransaction: input.originalPoiTransaction,
      };
    }

    const auth = this.buildAuth(row);
    const amount = (input.amountOre / 100).toFixed(2);
    const timestamp = new Date().toISOString();
    const serviceId = String(randomInt(1000, 9999));

    const body = {
      MessageHeader: {
        MessageClass: 'SERVICE',
        MessageCategory: 'REVERSAL',
        MessageType: 'REQUEST',
        ServiceID: serviceId,
        SaleID: row.saleId,
        POIID: row.poiId,
      },
      ReversalRequest: {
        OriginalPOITransaction: {
          POITransactionID: {
            TransactionID: input.originalPoiTransaction.transactionId,
            TimeStamp: input.originalPoiTransaction.timestamp,
          },
        },
        ReversalReason: input.reason ?? 'MERCHANT_CANCEL',
        CustomerOrder: {
          CustomerOrderID: input.transactionId,
          StartDate: timestamp,
          ForecastedAmount: amount,
          OpenOrderState: false,
          Currency: input.currency,
        },
      },
    };

    return this.postVerifone(
      tenantId,
      row,
      auth,
      `${config.verifoneApiUrl}/oidc/poscloud/nexo/v2/reversal`,
      body,
      input.transactionId,
    );
  }

  async abortSale(tenantId: string, saleTransactionId: string): Promise<{ ok: boolean; error?: string }> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      return { ok: false, error: 'Verifone is not set up for this shop.' };
    }

    if (row.useSimulator || config.verifoneSimulator) {
      return { ok: true };
    }

    const auth = this.buildAuth(row);
    const serviceId = String(randomInt(1000, 9999));
    const body = {
      MessageHeader: {
        MessageClass: 'SERVICE',
        MessageCategory: 'ABORT',
        MessageType: 'REQUEST',
        ServiceID: serviceId,
        SaleID: row.saleId,
        POIID: row.poiId,
      },
      AbortRequest: {
        AbortReason: 'MERCHANT_ABORT',
        MessageReference: {
          MessageCategory: 'PAYMENT',
          ServiceID: serviceId,
          SaleID: row.saleId,
          POIID: row.poiId,
        },
      },
    };

    try {
      const response = await fetch(`${config.verifoneApiUrl}/oidc/poscloud/nexo/abort`, {
        method: 'POST',
        headers: this.buildHeaders(row, auth),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: text.trim() || `Verifone returned HTTP ${response.status}.` };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          'Could not reach Verifone POS Cloud. ' + (err instanceof Error ? err.message : ''),
      };
    }
  }

  private async paymentRequest(
    tenantId: string,
    input: VerifoneSaleInput,
    paymentType: 'NORMAL' | 'REFUND',
    originalPoi?: VerifonePoiTransaction,
    poiIdOverride?: string,
  ): Promise<VerifoneSaleResult> {
    const row = await this.configs.findByTenantId(tenantId);
    if (!row) {
      return {
        ok: false,
        result: 'FAILURE',
        transactionId: input.transactionId,
        error: 'Verifone is not set up for this shop.',
      };
    }

    if (row.useSimulator || config.verifoneSimulator) {
      return {
        ok: true,
        result: 'SUCCESS',
        transactionId: input.transactionId,
        poiTransaction: {
          transactionId: generateQuickpayOrderRef(),
          timestamp: new Date().toISOString(),
        },
      };
    }

    const auth = this.buildAuth(row);
    const poiId = poiIdOverride?.trim() || row.poiId;
    const amount = (input.amountOre / 100).toFixed(2);
    const timestamp = new Date().toISOString();
    const serviceId = String(randomInt(1000, 9999));

    const body = {
      MessageHeader: {
        MessageClass: 'SERVICE',
        MessageCategory: 'PAYMENT',
        MessageType: 'REQUEST',
        ServiceID: serviceId,
        SaleID: row.saleId,
        POIID: poiId,
      },
      PaymentRequest: {
        SaleData: {
          SaleTransactionID: {
            TransactionID: input.transactionId,
            TimeStamp: timestamp,
          },
          ...(originalPoi
            ? {
                SaleToPOIData: JSON.stringify({
                  poiTx: originalPoi.transactionId,
                  ts: originalPoi.timestamp,
                }),
              }
            : {}),
        },
        PaymentTransaction: {
          AmountsReq: {
            Currency: input.currency,
            RequestedAmount: amount,
          },
        },
        PaymentData: {
          PaymentType: paymentType,
          SplitPaymentFlag: false,
        },
      },
    };

    return this.postVerifone(
      tenantId,
      row,
      auth,
      `${config.verifoneApiUrl}/oidc/poscloud/nexo/v2/payment`,
      body,
      input.transactionId,
    );
  }

  private async postVerifone(
    _tenantId: string,
    row: VerifoneConfigRow,
    auth: string,
    url: string,
    body: unknown,
    transactionId: string,
  ): Promise<VerifoneSaleResult> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(row, auth),
        body: JSON.stringify(body),
      });

      const text = await response.text();
      if (!response.ok) {
        return {
          ok: false,
          result: 'FAILURE',
          transactionId,
          error: text.trim() || `Verifone returned HTTP ${response.status}.`,
        };
      }

      const payload = JSON.parse(text) as VerifonePaymentResponse;
      const result = payload.PaymentResponse?.Response?.Result ?? 'FAILURE';
      const success = result === 'SUCCESS';
      const poi = payload.PaymentResponse?.POIData?.POITransactionID;

      return {
        ok: success,
        result: success ? 'SUCCESS' : 'FAILURE',
        transactionId:
          payload.PaymentResponse?.SaleData?.SaleTransactionID?.TransactionID ?? transactionId,
        poiTransaction: poi?.TransactionID
          ? {
              transactionId: poi.TransactionID,
              timestamp: poi.TimeStamp ?? new Date().toISOString(),
            }
          : undefined,
        error: success
          ? undefined
          : payload.PaymentResponse?.Response?.ErrorCondition ??
            'Payment was not approved on the terminal.',
      };
    } catch (err) {
      return {
        ok: false,
        result: 'FAILURE',
        transactionId,
        error:
          'Could not reach Verifone POS Cloud. Check your internet connection and terminal setup. ' +
          (err instanceof Error ? err.message : ''),
      };
    }
  }

  private buildAuth(row: VerifoneConfigRow): string {
    const apiKey = decryptSecret(row.apiKeyEnc);
    return Buffer.from(`${row.userUid}:${apiKey}`).toString('base64');
  }

  private buildHeaders(row: VerifoneConfigRow, auth: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (row.useSimulator || config.verifoneSimulator) {
      headers['x-terminal-simulator'] = 'true';
    }
    return headers;
  }
}

export const verifoneClient = new VerifoneClient();
