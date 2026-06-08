import type { Express } from 'express';
import {
  addMerchantNoteController,
  archiveMerchantController,
  createMerchantController,
  exportMerchantDataController,
  exportMerchantsController,
  getDashboardStatsController,
  getMerchantController,
  listMerchantOrdersController,
  listMerchantsController,
  pingMerchantQuickpayController,
  saveMerchantQuickpayController,
} from '../controllers/platform.controller.js';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.middleware.js';

export function registerPlatformRoutes(app: Express) {
  app.get(
    '/api/v1/platform/dashboard/stats',
    requireAuth,
    requirePlatformAdmin,
    getDashboardStatsController,
  );

  app.get(
    '/api/v1/platform/merchants',
    requireAuth,
    requirePlatformAdmin,
    listMerchantsController,
  );

  app.post(
    '/api/v1/platform/merchants',
    requireAuth,
    requirePlatformAdmin,
    createMerchantController,
  );

  app.get(
    '/api/v1/platform/merchants/export',
    requireAuth,
    requirePlatformAdmin,
    exportMerchantsController,
  );

  app.get(
    '/api/v1/platform/merchants/:tenantId/orders',
    requireAuth,
    requirePlatformAdmin,
    listMerchantOrdersController,
  );

  app.get(
    '/api/v1/platform/merchants/:tenantId',
    requireAuth,
    requirePlatformAdmin,
    getMerchantController,
  );

  app.post(
    '/api/v1/platform/merchants/:tenantId/ping-quickpay',
    requireAuth,
    requirePlatformAdmin,
    pingMerchantQuickpayController,
  );

  app.put(
    '/api/v1/platform/merchants/:tenantId/quickpay',
    requireAuth,
    requirePlatformAdmin,
    saveMerchantQuickpayController,
  );

  app.post(
    '/api/v1/platform/merchants/:tenantId/notes',
    requireAuth,
    requirePlatformAdmin,
    addMerchantNoteController,
  );

  app.get(
    '/api/v1/platform/merchants/:tenantId/export-data',
    requireAuth,
    requirePlatformAdmin,
    exportMerchantDataController,
  );

  app.post(
    '/api/v1/platform/merchants/:tenantId/archive',
    requireAuth,
    requirePlatformAdmin,
    archiveMerchantController,
  );
}
