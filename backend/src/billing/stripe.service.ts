import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — billing features disabled');
    }
  }

  get isConfigured(): boolean {
    return this.stripe !== null;
  }

  async createCustomer(email: string, name: string): Promise<string> {
    if (!this.stripe) throw new Error('Stripe not configured');
    const customer = await this.stripe.customers.create({ email, name });
    return customer.id;
  }

  async createCheckoutSession(
    stripeCustomerId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<string> {
    if (!this.stripe) throw new Error('Stripe not configured');
    const priceId = this.configService.get<string>('STRIPE_PRICE_ID_PRO');
    if (!priceId) throw new Error('STRIPE_PRICE_ID_PRO not set');

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url!;
  }

  async createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
    if (!this.stripe) throw new Error('Stripe not configured');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) throw new Error('Stripe not configured');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
