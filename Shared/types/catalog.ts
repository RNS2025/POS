import type { PaginatedResponse } from './platform.js';

export type KasseType = 'kiosk' | 'register';

export interface KasseSummary {
  id: string;
  type: KasseType;
  name: string;
  slug: string;
  verifonePoiId: string | null;
  payWithQrEnabled: boolean;
  payWithSmsEnabled: boolean;
  payWithLaterEnabled: boolean;
  payWithTerminalEnabled: boolean;
  isActive: boolean;
  productCount?: number;
}

export interface CreateKasseRequest {
  type: KasseType;
  name: string;
  slug: string;
  verifonePoiId?: string;
  payWithQrEnabled?: boolean;
  payWithSmsEnabled?: boolean;
  payWithLaterEnabled?: boolean;
  payWithTerminalEnabled?: boolean;
}

export interface UpdateKasseRequest {
  name?: string;
  slug?: string;
  type?: KasseType;
  verifonePoiId?: string | null;
  payWithQrEnabled?: boolean;
  payWithSmsEnabled?: boolean;
  payWithLaterEnabled?: boolean;
  payWithTerminalEnabled?: boolean;
  isActive?: boolean;
}

export interface SetKasseProductsRequest {
  productIds: string[];
}

export interface CategorySummary {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductSummary {
  id: string;
  name: string;
  priceOre: number;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  isActive: boolean;
  kasseIds: string[];
}

export interface CreateProductRequest {
  name: string;
  priceOre: number;
  categoryId?: string | null;
  kasseIds?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  priceOre?: number;
  categoryId?: string | null;
  isActive?: boolean;
  kasseIds?: string[];
  removeImage?: boolean;
}

export type KasseListResponse = PaginatedResponse<KasseSummary>;
export type CategoryListResponse = PaginatedResponse<CategorySummary>;
export type ProductListResponse = PaginatedResponse<ProductSummary>;
