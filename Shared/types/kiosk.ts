export interface KioskPaymentMethods {
  qr: boolean;
  sms: boolean;
  later: boolean;
}

export interface KioskCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface KioskProduct {
  id: string;
  name: string;
  priceOre: number;
  categoryId: string | null;
  imageUrl: string | null;
}

export interface KioskCatalogResponse {
  shopName: string;
  kasseName: string;
  kasseSlug: string;
  paymentMethods: KioskPaymentMethods;
  requirePhoneUpFront: boolean;
  categories: KioskCategory[];
  products: KioskProduct[];
}

export interface KioskCheckoutLine {
  productId: string;
  quantity: number;
}

export type KioskPaymentMethod = 'qr' | 'later';

export interface KioskCheckoutRequest {
  paymentMethod: KioskPaymentMethod;
  lines: KioskCheckoutLine[];
  customerPhone?: string;
}

export interface KioskCheckoutQrResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: string;
  paymentUrl: string;
}

export interface KioskCheckoutLaterResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: 'pending_payment';
}

export type KioskCheckoutResponse = KioskCheckoutQrResponse | KioskCheckoutLaterResponse;
