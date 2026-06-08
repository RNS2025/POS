import type { KioskCategory, KioskCheckoutLine, KioskProduct } from './kiosk.js';

export interface KasseCatalogResponse {
  shopName: string;
  kasseName: string;
  kasseSlug: string;
  verifonePoiId: string | null;
  payWithQrEnabled: boolean;
  categories: KioskCategory[];
  products: KioskProduct[];
}

export interface KassePinRequest {
  pin: string;
}

export interface KassePinResponse {
  token: string;
  staffUserId: string;
  displayName: string | null;
  kasseId: string;
  kasseSlug: string;
  expiresAt: string;
}

export interface KasseSaleRequest {
  lines: KioskCheckoutLine[];
}

export interface KasseQrRequest {
  lines: KioskCheckoutLine[];
}

export interface KasseSaleResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: string;
  channel: 'terminal';
}

export interface KasseQrResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: string;
  paymentUrl: string;
}

export interface KasseOrderStatusResponse {
  orderId: string;
  status: string;
  paymentStatus: string | null;
  amountOre: number;
  currency: string;
  paymentUrl: string | null;
}

export interface KasseReceiptLine {
  nameSnapshot: string;
  quantity: number;
  lineTotalOre: number;
}

export interface KasseReceiptResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: string;
  kasseName: string;
  staffDisplayName: string | null;
  lines: KasseReceiptLine[];
  createdAt: string;
}
