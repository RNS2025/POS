import type { User } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface IUserRepository {
  findByEmailAndTenant(email: string, tenantId: string): Promise<User | null>;
  findPlatformAdminByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    passwordHash: string;
    role: string;
    tenantId: string | null;
  }): Promise<User>;
}

export class UserRepository implements IUserRepository {
  findByEmailAndTenant(email: string, tenantId: string) {
    return prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
  }

  findPlatformAdminByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, role: 'platform_admin' },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    role: string;
    tenantId: string | null;
  }) {
    return prisma.user.create({ data });
  }
}

export const userRepository = new UserRepository();
