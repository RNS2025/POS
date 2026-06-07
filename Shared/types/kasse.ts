export interface CreateKasseSaleRequest {
  amountOre: number;
  currency?: string;
  description?: string;
}

export interface KasseSaleResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: string;
  channel: 'terminal';
}

export interface KasseSaleStatusResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: string;
  paymentStatus: string | null;
  channel: string;
  createdAt: string;
  allowedActions?: string[];
}
