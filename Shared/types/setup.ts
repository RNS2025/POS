export interface SetupQuickpayRequest {
  merchantId: string;
  privateKey: string;
  apiKey: string;
}

export interface SetupVerifoneRequest {
  userUid: string;
  apiKey: string;
  poiId: string;
  saleId: string;
  useSimulator?: boolean;
}

export interface SetupVerifoneMasked {
  userUid: string;
  apiKeyMasked: string;
  poiId: string;
  saleId: string;
  useSimulator: boolean;
}

export interface SetupGuide {
  title: string;
}

export interface SetupQuickpayMasked {
  merchantId: string;
  privateKeyMasked: string;
  apiKeyMasked: string;
}

export interface SetupResponse {
  shopName: string;
  slug: string;
  quickpayConnected: boolean;
  quickpayConnectedAt: string | null;
  lastPingAt: string | null;
  lastPingError: string | null;
  webhookUrl: string | null;
  quickpay: SetupQuickpayMasked | null;
  verifoneConnected: boolean;
  verifoneConnectedAt: string | null;
  verifoneLastPingAt: string | null;
  verifoneLastPingError: string | null;
  verifone: SetupVerifoneMasked | null;
  guides: SetupGuide[];
}

export interface QuickpayPingResult {
  ok: boolean;
  error?: string;
}
