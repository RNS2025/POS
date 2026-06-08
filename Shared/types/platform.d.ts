export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export type MerchantStatus = 'registered' | 'quickpay_connected' | 'live' | 'attention';
export interface PlatformMerchantSummary {
    id: string;
    name: string;
    slug: string;
    status: MerchantStatus;
    createdAt: string;
    quickpayConnectedAt: string | null;
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
export interface PlatformMerchantListQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: MerchantStatus;
}
export interface CreatePlatformNoteRequest {
    body: string;
}
export interface SavePlatformQuickpayRequest {
    merchantId: string;
    privateKey?: string;
    apiKey?: string;
}
