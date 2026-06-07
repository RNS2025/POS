import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { prisma } from '../src/infra/db.js';

const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.PLATFORM_ADMIN_PASSWORD;

async function main() {
  if (!email || !password) {
    console.error('Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in Server/.env');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('PLATFORM_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: { email, role: 'platform_admin' },
  });

  if (existing) {
    console.log(`Platform admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'platform_admin',
      tenantId: null,
    },
  });

  console.log(`Created platform admin: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
