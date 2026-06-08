import type { User } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmailAndTenant(email: string, tenantId: string): Promise<User | null>;
  findPlatformAdminByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    passwordHash: string;
    role: string;
    tenantId: string | null;
    displayName?: string;
    mustChangePassword?: boolean;
  }): Promise<User>;
  updatePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<User>;
}

export class UserRepository implements IUserRepository {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

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
    displayName?: string;
    mustChangePassword?: boolean;
  }) {
    return prisma.user.create({ data });
  }

  updatePassword(id: string, passwordHash: string, mustChangePassword: boolean) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword },
    });
  }
}

export const userRepository = new UserRepository();
