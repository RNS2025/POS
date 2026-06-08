import type { Response } from 'express';
import { kasserService } from '../services/kasser.service.js';
import { categoryService } from '../services/category.service.js';
import { productService } from '../services/product.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { TenantRequest } from '../middleware/resolve-tenant.middleware.js';

type CatalogRequest = AuthenticatedRequest & TenantRequest;

function tenantCtx(req: CatalogRequest) {
  return { id: req.tenant!.id, slug: req.tenant!.slug };
}

export const listKasserController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await kasserService.list(req.auth!, tenantCtx(req), page, limit);
  res.json(result);
});

export const getKasseController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await kasserService.get(req.auth!, tenantCtx(req), req.params.kasseId!);
  res.json(result);
});

export const createKasseController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await kasserService.create(req.auth!, tenantCtx(req), req.body);
  res.status(201).json(result);
});

export const updateKasseController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await kasserService.update(req.auth!, tenantCtx(req), req.params.kasseId!, req.body);
  res.json(result);
});

export const setKasseProductsController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await kasserService.setProducts(req.auth!, tenantCtx(req), req.params.kasseId!, req.body);
  res.json(result);
});

export const listCategoriesController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const result = await categoryService.list(req.auth!, tenantCtx(req), page, limit);
  res.json(result);
});

export const getCategoryController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await categoryService.get(req.auth!, tenantCtx(req), req.params.categoryId!);
  res.json(result);
});

export const createCategoryController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await categoryService.create(req.auth!, tenantCtx(req), req.body);
  res.status(201).json(result);
});

export const updateCategoryController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await categoryService.update(req.auth!, tenantCtx(req), req.params.categoryId!, req.body);
  res.json(result);
});

export const deleteCategoryController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await categoryService.delete(req.auth!, tenantCtx(req), req.params.categoryId!);
  res.json(result);
});

export const listProductsController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await productService.list(req.auth!, tenantCtx(req), page, limit);
  res.json(result);
});

export const getProductController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const result = await productService.get(req.auth!, tenantCtx(req), req.params.productId!);
  res.json(result);
});

export const createProductController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  const result = await productService.create(req.auth!, tenantCtx(req), req.body, file);
  res.status(201).json(result);
});

export const updateProductController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  const result = await productService.update(req.auth!, tenantCtx(req), req.params.productId!, req.body, file);
  res.json(result);
});

export const getProductImageController = asyncHandler(async (req: CatalogRequest, res: Response) => {
  const tenant = tenantCtx(req);
  const image = await productService.getImage(tenant.id, tenant.slug, req.params.productId!);
  if (!image) {
    res.status(404).json({ error: 'Image not found.' });
    return;
  }
  res.setHeader('Content-Type', image.contentType);
  res.send(image.buffer);
});
