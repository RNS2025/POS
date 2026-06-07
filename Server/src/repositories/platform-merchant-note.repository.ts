import { prisma } from '../infra/db.js';

export interface IPlatformMerchantNoteRepository {
  create(tenantId: string, authorId: string, body: string): Promise<{
    id: string;
    body: string;
    createdAt: Date;
    author: { email: string };
  }>;
}

export class PlatformMerchantNoteRepository implements IPlatformMerchantNoteRepository {
  create(tenantId: string, authorId: string, body: string) {
    return prisma.platformMerchantNote.create({
      data: { tenantId, authorId, body },
      include: { author: { select: { email: true } } },
    });
  }
}

export const platformMerchantNoteRepository = new PlatformMerchantNoteRepository();
