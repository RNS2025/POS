import { createRequire } from 'node:module';
import { PassThrough } from 'node:stream';

const require = createRequire(import.meta.url);
const archiver = require('archiver') as (format: string, options?: { zlib?: { level?: number } }) => {
  on(event: 'error', handler: (err: Error) => void): void;
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
  append(source: string, options: { name: string }): void;
  finalize(): Promise<void>;
};
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IPlatformAuditLogRepository } from '../repositories/platform-audit-log.repository.js';
import { platformAuditLogRepository } from '../repositories/platform-audit-log.repository.js';
import type { IPlatformExportRepository } from '../repositories/platform-export.repository.js';
import { platformExportRepository } from '../repositories/platform-export.repository.js';

function iso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

export class PlatformExportService {
  constructor(
    private readonly exports: IPlatformExportRepository = platformExportRepository,
    private readonly audit: IPlatformAuditLogRepository = platformAuditLogRepository,
  ) {}

  async createExportZip(auth: JwtPayload, tenantId: string) {
    this.requirePlatformAdmin(auth);

    const data = await this.exports.loadTenantExportData(tenantId);
    if (!data) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    await this.audit.create(tenantId, auth.sub, 'export_data');

    const exportedAt = new Date().toISOString();
    const manifest = {
      exportedAt,
      tenantId: data.tenant.id,
      slug: data.tenant.slug,
      exportedByUserId: auth.sub,
    };

    const tenantJson = {
      ...data.tenant,
      archivedAt: iso(data.tenant.archivedAt),
      quickpayConnectedAt: iso(data.tenant.quickpayConnectedAt),
      verifoneConnectedAt: iso(data.tenant.verifoneConnectedAt),
      createdAt: data.tenant.createdAt.toISOString(),
      updatedAt: data.tenant.updatedAt.toISOString(),
    };

    const usersJson = data.users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));

    const categoriesJson = data.categories.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    const productsJson = data.products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const kasserJson = data.kasser.map((k) => ({
      ...k,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
    }));

    const ordersJson = data.orders.map((o) => ({
      id: o.id,
      channel: o.channel,
      quickpayOrderRef: o.quickpayOrderRef,
      amountOre: o.amountOre,
      currency: o.currency,
      status: o.status,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      paymentMethod: o.paymentMethod,
      description: o.description,
      kasseId: o.kasseId,
      staffUserId: o.staffUserId,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      lineItems: o.lineItems.map((li) => ({
        ...li,
        createdAt: li.createdAt.toISOString(),
      })),
      payment: o.payment
        ? {
            ...o.payment,
            createdAt: o.payment.createdAt.toISOString(),
            updatedAt: o.payment.updatedAt.toISOString(),
          }
        : null,
    }));

    const notesJson = data.notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }));

    const stream = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => stream.destroy(err));
    archive.pipe(stream);

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    archive.append(JSON.stringify(tenantJson, null, 2), { name: 'tenant.json' });
    archive.append(JSON.stringify(usersJson, null, 2), { name: 'users.json' });
    archive.append(JSON.stringify(categoriesJson, null, 2), { name: 'categories.json' });
    archive.append(JSON.stringify(productsJson, null, 2), { name: 'products.json' });
    archive.append(JSON.stringify(kasserJson, null, 2), { name: 'kasser.json' });
    archive.append(JSON.stringify(ordersJson, null, 2), { name: 'orders.json' });
    archive.append(JSON.stringify(notesJson, null, 2), { name: 'notes.json' });

    void archive.finalize();

    const filename = `${data.tenant.slug}-export-${exportedAt.slice(0, 10)}.zip`;
    return { stream, filename };
  }

  private requirePlatformAdmin(auth: JwtPayload) {
    if (auth.role !== 'platform_admin') {
      throw new AppError('This action is only for RNS platform administrators.', 403);
    }
  }
}

export const platformExportService = new PlatformExportService();
