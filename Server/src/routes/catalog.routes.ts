import type { Express } from 'express';
import multer from 'multer';
import {
  createCategoryController,
  createKasseController,
  createProductController,
  deleteCategoryController,
  getCategoryController,
  getKasseController,
  getProductController,
  getProductImageController,
  listCategoriesController,
  listKasserController,
  listProductsController,
  setKasseProductsController,
  updateCategoryController,
  updateKasseController,
  updateProductController,
} from '../controllers/catalog.controller.js';
import { requireAuth, requirePasswordChanged, requireTenantMatch } from '../middleware/auth.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const tenant = [
  requireAuth,
  resolveTenantFromSlug('tenantSlug'),
  requireTenantMatch('tenantSlug'),
  requirePasswordChanged(),
];

export function registerCatalogRoutes(app: Express) {
  app.get('/api/v1/tenants/:tenantSlug/kasser', ...tenant, listKasserController);
  app.get('/api/v1/tenants/:tenantSlug/kasser/:kasseId', ...tenant, getKasseController);
  app.post('/api/v1/tenants/:tenantSlug/kasser', ...tenant, createKasseController);
  app.patch('/api/v1/tenants/:tenantSlug/kasser/:kasseId', ...tenant, updateKasseController);
  app.put('/api/v1/tenants/:tenantSlug/kasser/:kasseId/products', ...tenant, setKasseProductsController);

  app.get('/api/v1/tenants/:tenantSlug/categories', ...tenant, listCategoriesController);
  app.get('/api/v1/tenants/:tenantSlug/categories/:categoryId', ...tenant, getCategoryController);
  app.post('/api/v1/tenants/:tenantSlug/categories', ...tenant, createCategoryController);
  app.patch('/api/v1/tenants/:tenantSlug/categories/:categoryId', ...tenant, updateCategoryController);
  app.delete('/api/v1/tenants/:tenantSlug/categories/:categoryId', ...tenant, deleteCategoryController);

  app.get('/api/v1/tenants/:tenantSlug/products', ...tenant, listProductsController);
  app.get('/api/v1/tenants/:tenantSlug/products/:productId', ...tenant, getProductController);
  app.post('/api/v1/tenants/:tenantSlug/products', ...tenant, upload.single('image'), createProductController);
  app.patch('/api/v1/tenants/:tenantSlug/products/:productId', ...tenant, upload.single('image'), updateProductController);
  app.get(
    '/api/v1/tenants/:tenantSlug/products/:productId/image',
    resolveTenantFromSlug('tenantSlug'),
    getProductImageController,
  );
}
