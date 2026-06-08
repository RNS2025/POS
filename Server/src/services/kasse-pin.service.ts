import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { signKasseSession } from '../infra/jwt.js';
import type { Kasse } from '../generated/prisma/client.js';
import type { IStaffRepository } from '../repositories/staff.repository.js';
import { staffRepository } from '../repositories/staff.repository.js';

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4–6 digits.'),
});

export class KassePinService {
  constructor(private readonly staff: IStaffRepository = staffRepository) {}

  async login(
    tenant: { id: string; slug: string },
    kasse: Kasse,
    input: unknown,
  ) {
    const data = pinSchema.parse(input);
    const staffUsers = await this.staff.listActiveWithPin(tenant.id);

    for (const user of staffUsers) {
      if (!user.pinHash) {
        continue;
      }
      const valid = await bcrypt.compare(data.pin, user.pinHash);
      if (valid) {
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const token = signKasseSession({
          sub: user.id,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          kasseId: kasse.id,
          kasseSlug: kasse.slug,
          displayName: user.displayName,
        });
        return {
          token,
          staffUserId: user.id,
          displayName: user.displayName,
          kasseId: kasse.id,
          kasseSlug: kasse.slug,
          expiresAt: expiresAt.toISOString(),
        };
      }
    }

    throw new AppError('PIN not recognised. Try again or ask your manager.', 401);
  }
}

export const kassePinService = new KassePinService();
