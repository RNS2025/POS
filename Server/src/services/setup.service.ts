import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { decryptSecret, encryptSecret, maskSecret } from '../infra/crypto.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { ITenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import type { ITenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { tenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import type { ITenantRepository } from '../repositories/tenant.repository.js';
import { tenantRepository } from '../repositories/tenant.repository.js';
import type { IQuickpayClient } from './quickpay/quickpay.client.js';
import { quickpayClient } from './quickpay/quickpay.client.js';
import type { IVerifoneClient } from './verifone/verifone.client.js';
import { verifoneClient } from './verifone/verifone.client.js';
import { config } from '../infra/config.js';

const quickpaySchema = z.object({
  merchantId: z.string().min(1, 'Enter your Quickpay merchant number').max(64, 'Merchant number is too long'),
  privateKey: z.string().max(512).optional(),
  apiKey: z.string().max(512).optional(),
});

const verifoneSchema = z.object({
  userUid: z.string().min(1, 'Enter your Verifone user UID').max(128),
  apiKey: z.string().max(512).optional(),
  poiId: z.string().min(1, 'Enter your terminal ID (POIID)').max(64),
  saleId: z.string().min(1, 'Enter your sale ID').max(64),
  useSimulator: z.boolean().optional(),
});

const GUIDE_TITLES = [
  'Create a Quickpay account',
  'Create your shop in Quickpay and copy your keys',
  'Apply for Clearhaus (you negotiate directly with them)',
  'Payment notifications (handled automatically by us)',
  'Test a payment and go live',
];

export interface ISetupService {
  getSetup(auth: JwtPayload, tenantSlug: string): Promise<SetupDto>;
  saveQuickpay(auth: JwtPayload, tenantSlug: string, input: unknown): Promise<SetupDto>;
  saveVerifone(auth: JwtPayload, tenantSlug: string, input: unknown): Promise<SetupDto>;
}

export interface SetupDto {
  shopName: string;
  slug: string;
  quickpayConnected: boolean;
  quickpayConnectedAt: string | null;
  lastPingAt: string | null;
  lastPingError: string | null;
  webhookUrl: string | null;
  quickpay: {
    merchantId: string;
    privateKeyMasked: string;
    apiKeyMasked: string;
  } | null;
  verifoneConnected: boolean;
  verifoneConnectedAt: string | null;
  verifoneLastPingAt: string | null;
  verifoneLastPingError: string | null;
  verifone: {
    userUid: string;
    apiKeyMasked: string;
    poiId: string;
    saleId: string;
    useSimulator: boolean;
  } | null;
  guides: { title: string }[];
}

export class SetupService implements ISetupService {
  constructor(
    private readonly tenants: ITenantRepository = tenantRepository,
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly verifoneConfigs: ITenantVerifoneConfigRepository = tenantVerifoneConfigRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
    private readonly verifone: IVerifoneClient = verifoneClient,
  ) {}

  async getSetup(auth: JwtPayload, tenantSlug: string): Promise<SetupDto> {
    const tenant = await this.requireTenantAccess(auth, tenantSlug);
    return this.toDto(tenant);
  }

  async saveQuickpay(auth: JwtPayload, tenantSlug: string, input: unknown): Promise<SetupDto> {
    const tenant = await this.requireTenantAccess(auth, tenantSlug);
    const data = quickpaySchema.parse(input);
    const existing = await this.quickpayConfigs.findByTenantId(tenant.id);

    const privateKey =
      data.privateKey?.trim() || (existing ? decryptSecret(existing.privateKeyEnc) : '');
    const apiKey = data.apiKey?.trim() || (existing ? decryptSecret(existing.apiKeyEnc) : '');

    if (!privateKey || !apiKey) {
      throw new AppError(
        'Enter both the private key and payment window key from Quickpay Manager → Settings → Integration.',
        400,
      );
    }

    await this.quickpayConfigs.upsert({
      tenantId: tenant.id,
      merchantId: data.merchantId.trim(),
      privateKeyEnc: encryptSecret(privateKey),
      apiKeyEnc: encryptSecret(apiKey),
    });

    const ping = await this.quickpay.ping(tenant.id);
    const now = new Date();

    await this.quickpayConfigs.updatePing(tenant.id, {
      lastPingAt: now,
      lastPingOk: ping.ok,
      lastPingError: ping.error ?? null,
    });

    await this.tenants.updateQuickpayConnectedAt(tenant.id, ping.ok ? now : null);

    const updated = await this.tenants.findBySlug(tenant.slug);
    if (!updated) {
      throw new AppError('Your shop could not be loaded after saving. Refresh the page and try again.', 404);
    }

    return this.toDto(updated);
  }

  async saveVerifone(auth: JwtPayload, tenantSlug: string, input: unknown): Promise<SetupDto> {
    const tenant = await this.requireTenantAccess(auth, tenantSlug);
    const data = verifoneSchema.parse(input);
    const existing = await this.verifoneConfigs.findByTenantId(tenant.id);

    const apiKey = data.apiKey?.trim() || (existing ? decryptSecret(existing.apiKeyEnc) : '');
    if (!apiKey) {
      throw new AppError('Enter your Verifone API key from Verifone Central.', 400);
    }

    const useSimulator = data.useSimulator ?? existing?.useSimulator ?? config.verifoneSimulator;

    await this.verifoneConfigs.upsert({
      tenantId: tenant.id,
      userUid: data.userUid.trim(),
      apiKeyEnc: encryptSecret(apiKey),
      poiId: data.poiId.trim(),
      saleId: data.saleId.trim(),
      useSimulator,
    });

    const ping = await this.verifone.ping(tenant.id);
    const now = new Date();

    await this.verifoneConfigs.updatePing(tenant.id, {
      lastPingAt: now,
      lastPingOk: ping.ok,
      lastPingError: ping.error ?? null,
    });

    await this.tenants.updateVerifoneConnectedAt(tenant.id, ping.ok ? now : null);

    const updated = await this.tenants.findBySlug(tenant.slug);
    if (!updated) {
      throw new AppError('Your shop could not be loaded after saving. Refresh the page and try again.', 404);
    }

    return this.toDto(updated);
  }

  private async requireTenantAccess(auth: JwtPayload, tenantSlug: string) {
    const tenant = await this.tenants.findBySlug(tenantSlug);
    if (!tenant) {
      throw new AppError(
        `We couldn't find a shop at "${tenantSlug}". Check the link or log in again.`,
        404,
      );
    }

    if (auth.role === 'platform_admin') {
      return tenant;
    }

    if (auth.role !== 'admin' || auth.tenantId !== tenant.id || auth.tenantSlug !== tenant.slug) {
      throw new AppError(
        `You are logged in to a different shop. Log in with the web address "${tenantSlug}" to manage this shop.`,
        403,
      );
    }

    return tenant;
  }

  private toDto(
    tenant: Awaited<ReturnType<ITenantRepository['findBySlug']>> & object,
  ): SetupDto {
    const cfg = tenant.quickpayConfig;
    const vf = tenant.verifoneConfig;
    const connected = tenant.quickpayConnectedAt !== null && cfg?.lastPingOk === true;
    const verifoneConnected =
      tenant.verifoneConnectedAt !== null && vf?.lastPingOk === true;

    return {
      shopName: tenant.name,
      slug: tenant.slug,
      quickpayConnected: connected,
      quickpayConnectedAt: tenant.quickpayConnectedAt?.toISOString() ?? null,
      lastPingAt: cfg?.lastPingAt?.toISOString() ?? null,
      lastPingError: cfg?.lastPingError ?? null,
      webhookUrl: cfg ? this.quickpay.buildWebhookUrl(tenant.id) : null,
      quickpay: cfg
        ? {
            merchantId: cfg.merchantId,
            privateKeyMasked: maskSecret(decryptSecret(cfg.privateKeyEnc)),
            apiKeyMasked: maskSecret(decryptSecret(cfg.apiKeyEnc)),
          }
        : null,
      verifoneConnected,
      verifoneConnectedAt: tenant.verifoneConnectedAt?.toISOString() ?? null,
      verifoneLastPingAt: vf?.lastPingAt?.toISOString() ?? null,
      verifoneLastPingError: vf?.lastPingError ?? null,
      verifone: vf
        ? {
            userUid: vf.userUid,
            apiKeyMasked: maskSecret(decryptSecret(vf.apiKeyEnc)),
            poiId: vf.poiId,
            saleId: vf.saleId,
            useSimulator: vf.useSimulator,
          }
        : null,
      guides: GUIDE_TITLES.map((title) => ({ title })),
    };
  }
}

export const setupService = new SetupService();
