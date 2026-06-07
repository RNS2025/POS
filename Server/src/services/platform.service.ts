import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { config } from '../infra/config.js';
import type { JwtPayload } from '../infra/jwt.js';
import { platformMerchantNoteRepository } from '../repositories/platform-merchant-note.repository.js';
import type { IPlatformTenantRepository } from '../repositories/platform-tenant.repository.js';
import {
  parseListParams,
  platformTenantRepository,
} from '../repositories/platform-tenant.repository.js';
import type { ITenantInviteRepository } from '../repositories/tenant-invite.repository.js';
import { tenantInviteRepository } from '../repositories/tenant-invite.repository.js';
import { tenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import { tenantRepository } from '../repositories/tenant.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { assertSlugAllowed, slugSchema } from '../validation/tenant-slug.js';
import { toCsvRow } from '../utils/csv.js';
import type { IQuickpayClient } from './quickpay/quickpay.client.js';
import { quickpayClient } from './quickpay/quickpay.client.js';
import { toMerchantSummary } from './platform/merchant-status.js';

const patchSchema = z.object({
  clearhausConfirmed: z.boolean(),
});

const noteSchema = z.object({
  body: z.string().min(1, 'Enter a note').max(5000, 'Note is too long'),
});

const createMerchantSchema = z.object({
  shopName: z.string().min(1, 'Enter a shop name').max(200, 'Shop name is too long'),
  slug: slugSchema,
  adminEmail: z.string().email('Enter a valid email address'),
});

export class PlatformService {
  constructor(
    private readonly tenants: IPlatformTenantRepository = platformTenantRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
    private readonly invites: ITenantInviteRepository = tenantInviteRepository,
  ) {}

  listMerchants(auth: JwtPayload, query: Record<string, unknown>) {
    this.requirePlatformAdmin(auth);
    const params = parseListParams(query);

    return this.tenants.list(params).then(({ items, total }) => {
      const limit = Math.min(Math.max(params.limit, 1), 100);
      const page = Math.max(params.page, 1);

      return {
        items: items.map((t) => {
          const summary = toMerchantSummary(t, t.quickpayConfig ? this.quickpay.buildWebhookUrl(t.id) : null);
          const { webhookUrl: _w, ...rest } = summary;
          return rest;
        }),
        total,
        page,
        limit,
        hasMore: page * limit < total,
      };
    });
  }

  async getDashboardStats(auth: JwtPayload) {
    this.requirePlatformAdmin(auth);
    const [statusCounts, orderStats] = await Promise.all([
      this.tenants.countByStatus(),
      this.tenants.getOrderStats(),
    ]);
    return { ...statusCounts, ...orderStats };
  }

  async exportMerchantsCsv(auth: JwtPayload, query: Record<string, unknown>) {
    this.requirePlatformAdmin(auth);
    const params = parseListParams(query);
    const { items } = await this.tenants.list({ ...params, page: 1, limit: 1000 });

    const header = toCsvRow([
      'Shop name',
      'Web address',
      'Status',
      'Contact email',
      'Orders',
      'Last order',
      'Registered',
    ]);

    const rows = items.map((t) => {
      const summary = toMerchantSummary(
        t,
        t.quickpayConfig ? this.quickpay.buildWebhookUrl(t.id) : null,
      );
      return toCsvRow([
        summary.name,
        summary.slug,
        summary.status,
        summary.primaryContactEmail ?? '',
        String(summary.orderCount),
        summary.lastOrderAt ?? '',
        summary.createdAt,
      ]);
    });

    return [header, ...rows].join('\n');
  }

  async listMerchantOrders(auth: JwtPayload, tenantId: string, query: Record<string, unknown>) {
    this.requirePlatformAdmin(auth);

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);

    const { items, total } = await orderRepository.listForTenant(tenantId, page, limit);

    return {
      items: items.map((o) => ({
        id: o.id,
        quickpayOrderRef: o.quickpayOrderRef,
        amountOre: o.amountOre,
        currency: o.currency,
        status: o.status,
        channel: o.channel,
        paymentStatus: o.payment?.status ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async createMerchant(auth: JwtPayload, input: unknown) {
    this.requirePlatformAdmin(auth);
    const data = createMerchantSchema.parse(input);

    try {
      assertSlugAllowed(data.slug);
    } catch (err) {
      throw new AppError(err instanceof Error ? err.message : 'Invalid shop web address.', 409);
    }

    if (await tenantRepository.slugExists(data.slug)) {
      throw new AppError(
        `The shop address "${data.slug}" is already taken. Choose another web address.`,
        409,
      );
    }

    const tenant = await tenantRepository.create({ name: data.shopName.trim(), slug: data.slug });
    const invite = await this.invites.create(tenant.id, data.adminEmail);
    const inviteUrl = `${config.appPublicUrl}/invite/${invite.token}`;

    return {
      merchant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: 'registered' as const,
        createdAt: tenant.createdAt.toISOString(),
        quickpayConnectedAt: null,
        quickpayMerchantId: null,
        clearhausConfirmedAt: null,
        lastPingAt: null,
        lastPingOk: null,
        lastPingError: null,
        primaryContactEmail: invite.email,
        orderCount: 0,
        lastOrderAt: null,
      },
      inviteUrl,
      inviteExpiresAt: invite.expiresAt.toISOString(),
    };
  }

  async getMerchant(auth: JwtPayload, tenantId: string) {
    this.requirePlatformAdmin(auth);

    const tenant = await this.tenants.findDetailById(tenantId);
    if (!tenant) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    const webhookUrl = tenant.quickpayConfig
      ? this.quickpay.buildWebhookUrl(tenant.id)
      : null;

    const activeInvite = await this.invites.findActiveByTenantId(tenantId);

    const summary = toMerchantSummary(
      { ...tenant, users: tenant.users.map((u) => ({ email: u.email })) },
      webhookUrl,
    );

    return {
      ...summary,
      updatedAt: tenant.updatedAt.toISOString(),
      webhookUrl,
      users: tenant.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
      notes: tenant.platformNotes.map((n) => ({
        id: n.id,
        body: n.body,
        authorEmail: n.author.email,
        createdAt: n.createdAt.toISOString(),
      })),
      pendingInvite: activeInvite
        ? {
            email: activeInvite.email,
            expiresAt: activeInvite.expiresAt.toISOString(),
            inviteUrl: `${config.appPublicUrl}/invite/${activeInvite.token}`,
          }
        : null,
    };
  }

  async pingQuickpay(auth: JwtPayload, tenantId: string) {
    this.requirePlatformAdmin(auth);

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    const cfg = await tenantQuickpayConfigRepository.findByTenantId(tenantId);
    if (!cfg) {
      throw new AppError(
        'Quickpay is not set up for this merchant yet. They must save keys in shop setup first.',
        400,
      );
    }

    const ping = await this.quickpay.ping(tenantId);
    const now = new Date();

    await tenantQuickpayConfigRepository.updatePing(tenantId, {
      lastPingAt: now,
      lastPingOk: ping.ok,
      lastPingError: ping.error ?? null,
    });

    await tenantRepository.updateQuickpayConnectedAt(tenantId, ping.ok ? now : null);

    return this.getMerchant(auth, tenantId);
  }

  async patchMerchant(auth: JwtPayload, tenantId: string, input: unknown) {
    this.requirePlatformAdmin(auth);
    const data = patchSchema.parse(input);

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    await this.tenants.updateClearhaus(tenantId, data.clearhausConfirmed);

    return this.getMerchant(auth, tenantId);
  }

  async addNote(auth: JwtPayload, tenantId: string, input: unknown) {
    this.requirePlatformAdmin(auth);
    const data = noteSchema.parse(input);

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    const note = await platformMerchantNoteRepository.create(tenantId, auth.sub, data.body.trim());

    return {
      id: note.id,
      body: note.body,
      authorEmail: note.author.email,
      createdAt: note.createdAt.toISOString(),
    };
  }

  private requirePlatformAdmin(auth: JwtPayload) {
    if (auth.role !== 'platform_admin') {
      throw new AppError('This action is only for RNS platform administrators.', 403);
    }
  }
}

export const platformService = new PlatformService();
