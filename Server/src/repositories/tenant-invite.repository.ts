import { randomBytes } from 'node:crypto';
import type { TenantInvite } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

const INVITE_DAYS = 7;

export interface ITenantInviteRepository {
  create(tenantId: string, email: string): Promise<TenantInvite>;
  findByToken(token: string): Promise<
    | (TenantInvite & {
        tenant: { id: string; name: string; slug: string; lifecycleStatus: string };
      })
    | null
  >;
  findActiveByTenantId(tenantId: string): Promise<TenantInvite | null>;
  markUsed(id: string): Promise<void>;
}

function newToken(): string {
  return randomBytes(32).toString('hex');
}

function expiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + INVITE_DAYS);
  return date;
}

export class TenantInviteRepository implements ITenantInviteRepository {
  create(tenantId: string, email: string) {
    return prisma.tenantInvite.create({
      data: {
        tenantId,
        email: email.toLowerCase(),
        token: newToken(),
        expiresAt: expiresAt(),
      },
    });
  }

  findByToken(token: string) {
    return prisma.tenantInvite.findUnique({
      where: { token },
      include: {
        tenant: { select: { id: true, name: true, slug: true, lifecycleStatus: true } },
      },
    });
  }

  findActiveByTenantId(tenantId: string) {
    return prisma.tenantInvite.findFirst({
      where: {
        tenantId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  markUsed(id: string) {
    return prisma.tenantInvite
      .update({
        where: { id },
        data: { usedAt: new Date() },
      })
      .then(() => undefined);
  }
}

export const tenantInviteRepository = new TenantInviteRepository();
