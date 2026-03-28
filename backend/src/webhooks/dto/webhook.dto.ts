import { Allow } from 'class-validator';

export class OrderWebhookDto {
  @Allow() customer_email?: string;
  @Allow() customer_name?: string;
  @Allow() order_id?: string;
  @Allow() order_total?: number;
  @Allow() referral_code?: string;
  @Allow() external_customer_id?: string;
  @Allow() email?: string;
  // Shopify-compatible fields
  @Allow() customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    id?: number;
  };
  @Allow() id?: string | number;
  @Allow() total_price?: string;
  @Allow() subtotal_price?: string;
  @Allow() order_number?: string | number;
}

export class RefundWebhookDto {
  @Allow() order_id?: string;
  @Allow() id?: string | number;
}

export class CustomerWebhookDto {
  @Allow() customer_email?: string;
  @Allow() email?: string;
  @Allow() customer_name?: string;
  @Allow() first_name?: string;
  @Allow() last_name?: string;
  @Allow() external_customer_id?: string;
  @Allow() id?: string | number;
}
