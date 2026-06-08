import type { Kasse } from '../generated/prisma/client.js';
import { config } from '../infra/config.js';
import type { ICategoryRepository } from '../repositories/category.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import type { IProductRepository } from '../repositories/product.repository.js';
import { productRepository } from '../repositories/product.repository.js';

function productImageUrl(tenantSlug: string, productId: string, imageKey: string | null) {
  if (!imageKey) {
    return null;
  }
  return `${config.apiPublicUrl}/api/v1/tenants/${tenantSlug}/products/${productId}/image`;
}

export class KioskCatalogService {
  constructor(
    private readonly products: IProductRepository = productRepository,
    private readonly categories: ICategoryRepository = categoryRepository,
  ) {}

  async getCatalog(
    tenant: { id: string; slug: string; name: string },
    kasse: Kasse,
  ) {
    const productRows = await this.products.listActiveForKasse(tenant.id, kasse.id);
    const categoryRows = await this.categories.listActiveByTenant(tenant.id);
    const categoryIdsOnKasse = new Set(
      productRows.map((p) => p.categoryId).filter((id): id is string => id !== null),
    );

    const paymentMethods = {
      qr: kasse.payWithQrEnabled,
      sms: kasse.payWithSmsEnabled,
      later: kasse.payWithLaterEnabled,
      terminal: kasse.payWithTerminalEnabled && Boolean(kasse.verifonePoiId?.trim()),
    };

    return {
      shopName: tenant.name,
      kasseName: kasse.name,
      kasseSlug: kasse.slug,
      paymentMethods,
      requirePhoneUpFront: paymentMethods.sms || paymentMethods.later,
      categories: categoryRows
        .filter((c) => categoryIdsOnKasse.has(c.id))
        .map((c) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })),
      products: productRows.map((p) => ({
        id: p.id,
        name: p.name,
        priceOre: p.priceOre,
        categoryId: p.categoryId,
        imageUrl: productImageUrl(tenant.slug, p.id, p.imageKey),
      })),
    };
  }
}

export const kioskCatalogService = new KioskCatalogService();
