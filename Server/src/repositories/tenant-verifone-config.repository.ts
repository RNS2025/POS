import type { TenantVerifoneConfig } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface VerifoneConfigInput {
  tenantId: string;
  userUid: string;
  apiKeyEnc: string;
  poiId: string;
  saleId: string;
  useSimulator: boolean;
}

export interface PingUpdate {
  lastPingAt: Date;
  lastPingOk: boolean;
  lastPingError: string | null;
}

export interface ITenantVerifoneConfigRepository {
  findByTenantId(tenantId: string): Promise<TenantVerifoneConfig | null>;
  upsert(input: VerifoneConfigInput): Promise<TenantVerifoneConfig>;
  updatePing(tenantId: string, ping: PingUpdate): Promise<void>;
}

export class TenantVerifoneConfigRepository implements ITenantVerifoneConfigRepository {
  findByTenantId(tenantId: string) {
    return prisma.tenantVerifoneConfig.findUnique({ where: { tenantId } });
  }

  upsert(input: VerifoneConfigInput) {
    return prisma.tenantVerifoneConfig.upsert({
      where: { tenantId: input.tenantId },
      create: input,
      update: {
        userUid: input.userUid,
        apiKeyEnc: input.apiKeyEnc,
        poiId: input.poiId,
        saleId: input.saleId,
        useSimulator: input.useSimulator,
      },
    });
  }

  updatePing(tenantId: string, ping: PingUpdate) {
    return prisma.tenantVerifoneConfig
      .update({
        where: { tenantId },
        data: ping,
      })
      .then(() => undefined);
  }
}

export const tenantVerifoneConfigRepository = new TenantVerifoneConfigRepository();
