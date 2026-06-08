export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type MerchantStatus =
  | 'registered'
  | 'quickpay_connected'
  | 'live'
  | 'attention';

export interface PlatformMerchantSummary {
  id: string;
  name: string;
  slug: string;
  status: MerchantStatus;
  createdAt: string;
  quickpayConnectedAt: string | null;
  /** True when keys exist — platform never receives merchant id or secret values. */
  quickpayConfigured: boolean;
  lastPingAt: string | null;
  lastPingOk: boolean | null;
  lastPingError: string | null;
  primaryContactEmail: string | null;
  orderCount: number;
  lastOrderAt: string | null;
}

export interface PlatformMerchantUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface PlatformMerchantNote {
  id: string;
  body: string;
  authorEmail: string;
  createdAt: string;
}

export interface PlatformMerchantDetail extends PlatformMerchantSummary {
  updatedAt: string;
  users: PlatformMerchantUser[];
  notes: PlatformMerchantNote[];
  pendingInvite: PlatformPendingInvite | null;
}

export interface PlatformPendingInvite {
  email: string;
  expiresAt: string;
  inviteUrl: string;
}

export interface PlatformDashboardStats {
  total: number;
  byStatus: Record<MerchantStatus, number>;
  totalOrders: number;
  ordersLast7Days: number;
  capturedOrders: number;
}

export interface PlatformOrderSummary {
  id: string;
  quickpayOrderRef: string;
  amountOre: number;
  currency: string;
  status: string;
  channel: string;
  paymentStatus: string | null;
  createdAt: string;
}

export interface CreatePlatformMerchantRequest {
  shopName: string;
  slug: string;
  adminEmail: string;
}

export interface CreatePlatformMerchantResponse {
  merchant: PlatformMerchantSummary;
  inviteUrl: string;
  inviteExpiresAt: string;
}

export interface PlatformMerchantListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: MerchantStatus;
}

export interface CreatePlatformNoteRequest {
  body: string;
}

/** Platform write-only — saved keys are never returned. */
export interface SavePlatformQuickpayRequest {
  merchantId: string;
  privateKey?: string;
  apiKey?: string;
}
