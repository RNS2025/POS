import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { MerchantAdminRole } from '../domain/merchant-permissions.js';
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IAdminUserRepository } from '../repositories/admin-user.repository.js';
import { adminUserRepository } from '../repositories/admin-user.repository.js';
import { requireMerchantPermission } from '../utils/require-permission.js';

const merchantRoleSchema = z.enum(['owner', 'manager', 'viewer']);

const createSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  displayName: z.string().min(1).max(80),
  role: merchantRoleSchema,
  temporaryPassword: z.string().min(8).max(128),
});

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  role: merchantRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  temporaryPassword: z.string().min(8).max(128),
});

function toSummary(user: {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? user.email,
    role: user.role as MerchantAdminRole,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  };
}

export class AdminUsersService {
  constructor(private readonly adminUsers: IAdminUserRepository = adminUserRepository) {}

  async list(auth: JwtPayload, tenant: { id: string; slug: string }, page: number, limit: number) {
    requireMerchantPermission(auth, tenant.id, tenant.slug, 'users:read');
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const { items, total } = await this.adminUsers.listByTenant(tenant.id, safePage, safeLimit);
    return {
      items: items.map(toSummary),
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: safePage * safeLimit < total,
    };
  }

  async create(auth: JwtPayload, tenant: { id: string; slug: string }, input: unknown) {
    requireMerchantPermission(auth, tenant.id, tenant.slug, 'users:write');
    const data = createSchema.parse(input);
    const passwordHash = await bcrypt.hash(data.temporaryPassword, 12);
    try {
      const user = await this.adminUsers.create({
        tenantId: tenant.id,
        email: data.email.toLowerCase(),
        passwordHash,
        displayName: data.displayName,
        role: data.role,
        mustChangePassword: true,
      });
      console.info('[admin-users] created', {
        tenantId: tenant.id,
        actorId: auth.sub,
        targetUserId: user.id,
        role: user.role,
      });
      return toSummary(user);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
        throw new AppError('An admin user with this email already exists for this shop.', 409);
      }
      throw err;
    }
  }

  async update(
    auth: JwtPayload,
    tenant: { id: string; slug: string },
    userId: string,
    input: unknown,
  ) {
    requireMerchantPermission(auth, tenant.id, tenant.slug, 'users:write');
    const data = updateSchema.parse(input);
    const existing = await this.adminUsers.findById(tenant.id, userId);
    if (!existing) {
      throw new AppError('Admin user not found.', 404);
    }

    const nextRole = data.role ?? existing.role;
    const nextActive = data.isActive ?? existing.isActive;

    if (existing.role === 'owner' && (nextRole !== 'owner' || !nextActive)) {
      const otherOwners = await this.adminUsers.countActiveOwners(tenant.id, userId);
      if (otherOwners === 0) {
        throw new AppError('At least one active Owner must remain for this shop.', 409);
      }
    }

    if (userId === auth.sub && data.isActive === false) {
      throw new AppError('You cannot deactivate your own account.', 400);
    }

    const user = await this.adminUsers.update(tenant.id, userId, {
      displayName: data.displayName,
      role: data.role,
      isActive: data.isActive,
    });
    if (!user) {
      throw new AppError('Admin user not found.', 404);
    }

    console.info('[admin-users] updated', {
      tenantId: tenant.id,
      actorId: auth.sub,
      targetUserId: userId,
      patch: data,
    });
    return toSummary(user);
  }

  async resetPassword(
    auth: JwtPayload,
    tenant: { id: string; slug: string },
    userId: string,
    input: unknown,
  ) {
    requireMerchantPermission(auth, tenant.id, tenant.slug, 'users:write');
    const data = resetPasswordSchema.parse(input);
    const existing = await this.adminUsers.findById(tenant.id, userId);
    if (!existing) {
      throw new AppError('Admin user not found.', 404);
    }
    const passwordHash = await bcrypt.hash(data.temporaryPassword, 12);
    const user = await this.adminUsers.update(tenant.id, userId, {
      passwordHash,
      mustChangePassword: true,
    });
    if (!user) {
      throw new AppError('Admin user not found.', 404);
    }
    console.info('[admin-users] reset-password', {
      tenantId: tenant.id,
      actorId: auth.sub,
      targetUserId: userId,
    });
    return toSummary(user);
  }
}

export const adminUsersService = new AdminUsersService();
