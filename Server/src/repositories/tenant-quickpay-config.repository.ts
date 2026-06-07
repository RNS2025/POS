import type { TenantQuickpayConfig } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface QuickpayConfigInput {
  tenantId: string;
  merchantId: string;
  privateKeyEnc: string;
  apiKeyEnc: string;
}

export interface PingUpdate {
  lastPingAt: Date;
  lastPingOk: boolean;
  lastPingError: string | null;
}

export interface ITenantQuickpayConfigRepository {
  findByTenantId(tenantId: string): Promise<TenantQuickpayConfig | null>;
  upsert(input: QuickpayConfigInput): Promise<TenantQuickpayConfig>;
  updatePing(tenantId: string, ping: PingUpdate): Promise<void>;
}

export class TenantQuickpayConfigRepository implements ITenantQuickpayConfigRepository {
  findByTenantId(tenantId: string) {
    return prisma.tenantQuickpayConfig.findUnique({ where: { tenantId } });
  }

  upsert(input: QuickpayConfigInput) {
    return prisma.tenantQuickpayConfig.upsert({
      where: { tenantId: input.tenantId },
      create: input,
      update: {
        merchantId: input.merchantId,
        privateKeyEnc: input.privateKeyEnc,
        apiKeyEnc: input.apiKeyEnc,
      },
    });
  }

  updatePing(tenantId: string, ping: PingUpdate) {
    return prisma.tenantQuickpayConfig
      .update({
        where: { tenantId },
        data: ping,
      })
      .then(() => undefined);
  }
}

export const tenantQuickpayConfigRepository = new TenantQuickpayConfigRepository();
