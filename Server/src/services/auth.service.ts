import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { isMerchantAdminRole } from '../domain/merchant-permissions.js';
import { AppError } from '../infra/app-error.js';
import { signToken } from '../infra/jwt.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { ITenantInviteRepository } from '../repositories/tenant-invite.repository.js';
import { tenantInviteRepository } from '../repositories/tenant-invite.repository.js';
import type { ITenantRepository } from '../repositories/tenant.repository.js';
import { tenantRepository } from '../repositories/tenant.repository.js';
import type { IUserRepository } from '../repositories/user.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { assertSlugAllowed, slugSchema } from '../validation/tenant-slug.js';

const registerSchema = z.object({
  shopName: z.string().min(1, 'Enter your shop name').max(200, 'Shop name is too long'),
  slug: slugSchema,
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  tenantSlug: slugSchema.optional(),
});

const acceptInviteSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});

export interface IAuthService {
  register(input: unknown): Promise<{ token: string; user: AuthUserDto }>;
  login(input: unknown): Promise<{ token: string; user: AuthUserDto }>;
  getInvite(token: string): Promise<InvitePreviewDto>;
  acceptInvite(token: string, input: unknown): Promise<{ token: string; user: AuthUserDto }>;
  changePassword(auth: JwtPayload, input: unknown): Promise<{ token: string; user: AuthUserDto }>;
}

export interface AuthUserDto {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
  mustChangePassword: boolean;
}

export interface InvitePreviewDto {
  shopName: string;
  slug: string;
  email: string;
  expiresAt: string;
  expired: boolean;
  used: boolean;
}

export class AuthService implements IAuthService {
  constructor(
    private readonly tenants: ITenantRepository = tenantRepository,
    private readonly users: IUserRepository = userRepository,
    private readonly invites: ITenantInviteRepository = tenantInviteRepository,
  ) {}

  async register(input: unknown) {
    const data = registerSchema.parse(input);

    try {
      assertSlugAllowed(data.slug);
    } catch (err) {
      throw new AppError(err instanceof Error ? err.message : 'Invalid shop web address.', 409);
    }

    if (await this.tenants.slugExists(data.slug)) {
      throw new AppError(
        `The shop address "${data.slug}" is already taken. Choose another web address, or log in if this is already your shop.`,
        409,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const tenant = await this.tenants.create({ name: data.shopName, slug: data.slug });
    const user = await this.users.create({
      email: data.email.toLowerCase(),
      passwordHash,
      role: 'owner',
      tenantId: tenant.id,
      displayName: data.email.split('@')[0] ?? 'Owner',
      mustChangePassword: false,
    });

    const token = signToken({
      sub: user.id,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });

    return {
      token,
      user: this.toUserDto(user, tenant.slug),
    };
  }

  async login(input: unknown) {
    const data = loginSchema.parse(input);

    if (data.tenantSlug) {
      const tenant = await this.tenants.findBySlug(data.tenantSlug);
      if (!tenant || tenant.lifecycleStatus === 'archived') {
        throw new AppError(
          `We couldn't find a shop at "${data.tenantSlug}". Check the shop web address — it is the part after payment.rns-apps.dk/ (e.g. acme-bakery).`,
          401,
        );
      }

      const user = await this.users.findByEmailAndTenant(data.email.toLowerCase(), tenant.id);
      if (!user || !isMerchantAdminRole(user.role) || !user.isActive) {
        throw new AppError(
          `No admin account with email ${data.email} for shop "${data.tenantSlug}". Check the email or create a shop first.`,
          401,
        );
      }

      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        throw new AppError('Wrong password for that email and shop. Try again.', 401);
      }

      const token = signToken({
        sub: user.id,
        role: user.role,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      });

      return { token, user: this.toUserDto(user, tenant.slug) };
    }

    const user = await this.users.findPlatformAdminByEmail(data.email.toLowerCase());
    if (!user) {
      throw new AppError(
        'No RNS platform admin account with that email. Merchant log in requires a shop web address.',
        401,
      );
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Wrong password for that email.', 401);
    }

    const token = signToken({
      sub: user.id,
      role: user.role,
      tenantId: null,
      tenantSlug: null,
    });

    return { token, user: this.toUserDto(user, null) };
  }

  async changePassword(auth: JwtPayload, input: unknown) {
    const data = changePasswordSchema.parse(input);
    if (!isMerchantAdminRole(auth.role)) {
      throw new AppError('Only shop admin accounts can change password here.', 403);
    }

    const user = await this.users.findById(auth.sub);
    if (!user || !user.isActive) {
      throw new AppError('Your account could not be found.', 404);
    }

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('Current password is incorrect.', 401);
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    const updated = await this.users.updatePassword(user.id, passwordHash, false);

    const token = signToken({
      sub: updated.id,
      role: updated.role,
      tenantId: updated.tenantId,
      tenantSlug: auth.tenantSlug,
    });

    return {
      token,
      user: this.toUserDto(updated, auth.tenantSlug),
    };
  }

  async getInvite(token: string) {
    const invite = await this.invites.findByToken(token);
    if (!invite) {
      throw new AppError('This invite link is invalid. Ask RNS support for a new link.', 404);
    }

    const expired = invite.expiresAt.getTime() < Date.now();
    const used = invite.usedAt !== null;

    return {
      shopName: invite.tenant.name,
      slug: invite.tenant.slug,
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
      expired,
      used,
    };
  }

  async acceptInvite(token: string, input: unknown) {
    const data = acceptInviteSchema.parse(input);
    const invite = await this.invites.findByToken(token);

    if (!invite) {
      throw new AppError('This invite link is invalid. Ask RNS support for a new link.', 404);
    }
    if (invite.usedAt) {
      throw new AppError('This invite has already been used. Log in with your shop web address instead.', 409);
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new AppError('This invite has expired. Ask RNS support for a new link.', 410);
    }
    if (invite.tenant.lifecycleStatus === 'archived') {
      throw new AppError('This shop has been archived and is no longer accepting new users.', 410);
    }

    const existing = await this.users.findByEmailAndTenant(invite.email, invite.tenantId);
    if (existing) {
      throw new AppError(
        'An account already exists for this shop. Log in with your shop web address instead.',
        409,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.users.create({
      email: invite.email,
      passwordHash,
      role: 'owner',
      tenantId: invite.tenantId,
      displayName: invite.email.split('@')[0] ?? 'Owner',
      mustChangePassword: false,
    });

    await this.invites.markUsed(invite.id);

    const authToken = signToken({
      sub: user.id,
      role: user.role,
      tenantId: invite.tenantId,
      tenantSlug: invite.tenant.slug,
    });

    return {
      token: authToken,
      user: this.toUserDto(user, invite.tenant.slug),
    };
  }

  private toUserDto(
    user: {
      id: string;
      email: string;
      role: string;
      tenantId: string | null;
      mustChangePassword?: boolean;
    },
    tenantSlug: string | null,
  ): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug,
      mustChangePassword: user.mustChangePassword ?? false,
    };
  }
}

export const authService = new AuthService();
