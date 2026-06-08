import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import { prisma } from '../infra/db.js';
import { adminUsersService } from '../services/admin-users.service.js';
import type { JwtPayload } from '../infra/jwt.js';
import { AppError } from '../infra/app-error.js';

const runIntegration =
  process.env.RUN_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);

describe('admin users RBAC', { skip: !runIntegration }, () => {
  let tenantAId = '';
  let tenantBId = '';
  let ownerAId = '';
  let managerAId = '';
  const slugA = `rbac-a-${Date.now()}`;
  const slugB = `rbac-b-${Date.now()}`;

  before(async () => {
    const tenantA = await prisma.tenant.create({ data: { name: 'RBAC A', slug: slugA } });
    const tenantB = await prisma.tenant.create({ data: { name: 'RBAC B', slug: slugB } });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const ownerHash = await bcrypt.hash('owner-pass-123', 4);
    const managerHash = await bcrypt.hash('manager-pass-123', 4);

    const owner = await prisma.user.create({
      data: {
        tenantId: tenantAId,
        email: `owner@${slugA}.test`,
        passwordHash: ownerHash,
        role: 'owner',
        displayName: 'Owner A',
      },
    });
    const manager = await prisma.user.create({
      data: {
        tenantId: tenantAId,
        email: `manager@${slugA}.test`,
        passwordHash: managerHash,
        role: 'manager',
        displayName: 'Manager A',
      },
    });
    ownerAId = owner.id;
    managerAId = manager.id;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
  });

  it('owner can list admin users for own tenant', async () => {
    const auth: JwtPayload = { sub: ownerAId, role: 'owner', tenantId: tenantAId, tenantSlug: slugA };
    const res = await adminUsersService.list(auth, { id: tenantAId, slug: slugA }, 1, 20);
    assert.ok(res.items.length >= 2);
  });

  it('manager cannot list admin users', async () => {
    const auth: JwtPayload = { sub: managerAId, role: 'manager', tenantId: tenantAId, tenantSlug: slugA };
    await assert.rejects(
      () => adminUsersService.list(auth, { id: tenantAId, slug: slugA }, 1, 20),
      (err: unknown) => err instanceof AppError && (err as AppError).statusCode === 403,
    );
  });

  it('owner cannot access another tenant admin users', async () => {
    const auth: JwtPayload = { sub: ownerAId, role: 'owner', tenantId: tenantAId, tenantSlug: slugA };
    await assert.rejects(
      () => adminUsersService.list(auth, { id: tenantBId, slug: slugB }, 1, 20),
      (err: unknown) => err instanceof AppError && (err as AppError).statusCode === 403,
    );
  });

  it('cannot demote the last active owner', async () => {
    const auth: JwtPayload = { sub: ownerAId, role: 'owner', tenantId: tenantAId, tenantSlug: slugA };
    await assert.rejects(
      () => adminUsersService.update(auth, { id: tenantAId, slug: slugA }, ownerAId, { role: 'manager' }),
      (err: unknown) => err instanceof AppError && (err as AppError).statusCode === 409,
    );
  });
});
