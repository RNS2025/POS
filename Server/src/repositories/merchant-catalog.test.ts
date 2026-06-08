import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { prisma } from '../infra/db.js';
import { kasseRepository } from './kasse.repository.js';
import { productRepository } from './product.repository.js';
import { tenantRepository } from './tenant.repository.js';

const runIntegration =
  process.env.RUN_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);

describe('merchant catalog repositories', { skip: !runIntegration }, () => {
  let tenantAId = '';
  let tenantBId = '';
  let kasseAId = '';

  before(async () => {
    const a = await tenantRepository.create({ name: 'Catalog Test A', slug: `cat-a-${Date.now()}` });
    const b = await tenantRepository.create({ name: 'Catalog Test B', slug: `cat-b-${Date.now()}` });
    tenantAId = a.id;
    tenantBId = b.id;

    const kasser = await kasseRepository.listByTenant(tenantAId, 1, 10);
    assert.equal(kasser.total, 1, 'new tenant gets default kiosk kasse');
    kasseAId = kasser.items[0]!.id;
    assert.equal(kasser.items[0]!.slug, 'customer');
  });

  after(async () => {
    if (!tenantAId && !tenantBId) {
      return;
    }
    const ids = [tenantAId, tenantBId].filter(Boolean);
    await prisma.productKasse.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.category.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.kasse.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.tenant.deleteMany({ where: { id: { in: ids } } });
  });

  it('tenant B cannot read tenant A kasse by id', async () => {
    const row = await kasseRepository.findById(tenantBId, kasseAId);
    assert.equal(row, null);
  });

  it('tenant B cannot read tenant A product by id', async () => {
    const product = await productRepository.create(tenantAId, {
      name: 'Secret burger',
      priceOre: 9900,
      categoryId: null,
    });
    const leaked = await productRepository.findById(tenantBId, product.id);
    assert.equal(leaked, null);
  });
});
