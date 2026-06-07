export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export type MerchantStatus = 'registered' | 'quickpay_connected' | 'clearhaus_pending' | 'live' | 'attention';
export interface PlatformMerchantSummary {
    id: string;
    name: string;
    slug: string;
    status: MerchantStatus;
    createdAt: string;
    quickpayConnectedAt: string | null;
    quickpayMerchantId: string | null;
    clearhausConfirmedAt: string | null;
    lastPingAt: string | null;
    lastPingOk: boolean | null;
    lastPingError: string | null;
    primaryContactEmail: string | null;
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
    webhookUrl: string | null;
    users: PlatformMerchantUser[];
    notes: PlatformMerchantNote[];
}
export interface PlatformMerchantListQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: MerchantStatus;
}
export interface PatchPlatformMerchantRequest {
    clearhausConfirmed?: boolean;
}
export interface CreatePlatformNoteRequest {
    body: string;
}
