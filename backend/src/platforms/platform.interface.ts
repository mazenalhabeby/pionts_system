export interface PlatformConfig {
  projectId: number;
  platform: string;
  apiUrl?: string;
  apiKey?: string;
  webhookSecret?: string;
  // Shopify-specific
  shopDomain?: string;
  accessToken?: string;
}

export interface CreateDiscountResult {
  success: boolean;
  externalId?: string;
  code: string;
}

export interface IPlatformAdapter {
  readonly platform: string;
  createDiscount(config: PlatformConfig, code: string, amount: number, currency?: string): Promise<CreateDiscountResult>;
  deleteDiscount(config: PlatformConfig, code: string): Promise<boolean>;
  lookupCustomer?(config: PlatformConfig, email: string): Promise<{ name?: string; externalId?: string } | null>;
}
