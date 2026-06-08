import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { prisma } from '../src/infra/db.js';
import { assertSlugAllowed } from '../src/validation/tenant-slug.js';

const shopName = process.env.SEED_TENANT_NAME?.trim() ?? 'Demo Shop';
const slug = process.env.SEED_TENANT_SLUG?.trim() ?? 'demo-shop';
const email = process.env.SEED_TENANT_EMAIL?.trim().toLowerCase() ?? 'merchant@example.com';
const password = process.env.SEED_TENANT_PASSWORD ?? 'change-me-in-production';

async function main() {
  if (password.length < 8) {
    console.error('SEED_TENANT_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    assertSlugAllowed(slug);
  } catch (err) {
    console.error(err instanceof Error ? err.message : 'Invalid slug.');
    process.exit(1);
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    console.log(`Tenant "${slug}" already exists (${existing.name}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const tenant = await prisma.tenant.create({
    data: {
      name: shopName,
      slug,
      users: {
        create: {
          email,
          passwordHash,
          role: 'owner',
        },
      },
    },
  });

  console.log(`Created tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`Admin login: ${email} / shop web address "${slug}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
