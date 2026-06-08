import { prisma } from '../infra/db.js';

type TenantExportData = {
    tenant: {
      id: string;
      name: string;
      slug: string;
      lifecycleStatus: string;
      archivedAt: Date | null;
      quickpayConnectedAt: Date | null;
      verifoneConnectedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    users: Array<{
      id: string;
      email: string;
      role: string;
      displayName: string | null;
      isActive: boolean;
      createdAt: Date;
    }>;
    categories: Array<{
      id: string;
      name: string;
      sortOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    products: Array<{
      id: string;
      name: string;
      priceOre: number;
      categoryId: string | null;
      imageKey: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    kasser: Array<{
      id: string;
      type: string;
      name: string;
      slug: string;
      verifonePoiId: string | null;
      payWithQrEnabled: boolean;
      payWithSmsEnabled: boolean;
      payWithLaterEnabled: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    orders: Array<{
      id: string;
      channel: string;
      quickpayOrderRef: string;
      amountOre: number;
      currency: string;
      status: string;
      customerEmail: string | null;
      customerPhone: string | null;
      paymentMethod: string | null;
      description: string | null;
      kasseId: string | null;
      staffUserId: string | null;
      createdAt: Date;
      updatedAt: Date;
      lineItems: Array<{
        id: string;
        productId: string | null;
        nameSnapshot: string;
        unitPriceOre: number;
        quantity: number;
        lineTotalOre: number;
        createdAt: Date;
      }>;
      payment: {
        id: string;
        channel: string;
        quickpayPaymentId: number | null;
        quickpayMerchantId: string | null;
        verifoneTransactionId: string | null;
        status: string;
        amountOre: number;
        refundedAmountOre: number;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }>;
    notes: Array<{
      id: string;
      body: string;
      authorEmail: string;
      createdAt: Date;
    }>;
};

export interface IPlatformExportRepository {
  loadTenantExportData(tenantId: string): Promise<TenantExportData | null>;
}

export class PlatformExportRepository implements IPlatformExportRepository {
  async loadTenantExportData(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        lifecycleStatus: true,
        archivedAt: true,
        quickpayConnectedAt: true,
        verifoneConnectedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      return null;
    }

    const [users, categories, products, kasser, orders, notes] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          role: true,
          displayName: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.category.findMany({
        where: { tenantId },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.product.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
      }),
      prisma.kasse.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
      }),
      prisma.order.findMany({
        where: { tenantId },
        include: {
          lineItems: true,
          payment: {
            select: {
              id: true,
              channel: true,
              quickpayPaymentId: true,
              quickpayMerchantId: true,
              verifoneTransactionId: true,
              status: true,
              amountOre: true,
              refundedAmountOre: true,
              currency: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.platformMerchantNote.findMany({
        where: { tenantId },
        include: { author: { select: { email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      tenant,
      users,
      categories,
      products,
      kasser,
      orders,
      notes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        authorEmail: n.author.email,
        createdAt: n.createdAt,
      })),
    };
  }
}

export const platformExportRepository = new PlatformExportRepository();
