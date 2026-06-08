import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IStaffRepository } from '../repositories/staff.repository.js';
import { staffRepository } from '../repositories/staff.repository.js';
import { requireStaff } from '../utils/require-staff.js';

const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, 'PIN must be 4–6 digits.');

const createSchema = z.object({
  displayName: z.string().min(1).max(80),
  pin: pinSchema,
});

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  pin: pinSchema.optional(),
  isActive: z.boolean().optional(),
});

function toSummary(user: { id: string; displayName: string | null; isActive: boolean; pinHash: string | null; createdAt: Date }) {
  return {
    id: user.id,
    displayName: user.displayName ?? 'Staff',
    isActive: user.isActive,
    hasPin: Boolean(user.pinHash),
    createdAt: user.createdAt.toISOString(),
  };
}

export class StaffService {
  constructor(private readonly staff: IStaffRepository = staffRepository) {}

  async list(auth: JwtPayload, tenant: { id: string; slug: string }, page: number, limit: number) {
    requireStaff(auth, tenant.id, tenant.slug, 'staff:read');
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const { items, total } = await this.staff.listByTenant(tenant.id, safePage, safeLimit);
    return {
      items: items.map(toSummary),
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: safePage * safeLimit < total,
    };
  }

  async create(auth: JwtPayload, tenant: { id: string; slug: string }, input: unknown) {
    requireStaff(auth, tenant.id, tenant.slug, 'staff:write');
    const data = createSchema.parse(input);
    const pinHash = await bcrypt.hash(data.pin, 12);
    const email = `staff.${randomUUID()}@${tenant.slug}.staff.local`;
    const user = await this.staff.create({
      tenantId: tenant.id,
      email,
      displayName: data.displayName,
      pinHash,
    });
    return toSummary(user);
  }

  async update(auth: JwtPayload, tenant: { id: string; slug: string }, staffId: string, input: unknown) {
    requireStaff(auth, tenant.id, tenant.slug, 'staff:write');
    const data = updateSchema.parse(input);
    const patch: { displayName?: string; pinHash?: string; passwordHash?: string; isActive?: boolean } = {};
    if (data.displayName !== undefined) {
      patch.displayName = data.displayName;
    }
    if (data.pin !== undefined) {
      const pinHash = await bcrypt.hash(data.pin, 12);
      patch.pinHash = pinHash;
      patch.passwordHash = pinHash;
    }
    if (data.isActive !== undefined) {
      patch.isActive = data.isActive;
    }
    const user = await this.staff.update(tenant.id, staffId, patch);
    if (!user) {
      throw new AppError('Staff member not found.', 404);
    }
    return toSummary(user);
  }
}

export const staffService = new StaffService();
