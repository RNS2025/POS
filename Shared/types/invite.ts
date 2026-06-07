export interface InvitePreview {
  shopName: string;
  slug: string;
  email: string;
  expiresAt: string;
  expired: boolean;
  used: boolean;
}

export interface AcceptInviteRequest {
  password: string;
}
