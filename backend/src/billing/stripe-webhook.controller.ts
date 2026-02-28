import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { BillingService } from './billing.service';

@Controller('api/v1/billing/webhook')
@SkipThrottle()
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly billingService: BillingService,
  ) {}

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;
    try {
      const rawBody = (req as any).rawBody;
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err: any) {
      this.logger.error('Webhook signature verification failed', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          if (session.subscription && session.customer) {
            await this.billingService.handleSubscriptionUpdated(
              session.customer,
              session.subscription,
              'pro',
              'active',
              null,
            );
          }
          break;
        }
        case 'customer.subscription.updated': {
          const sub = event.data.object as any;
          const plan = sub.items?.data?.[0]?.price?.lookup_key === 'pro' ? 'pro' : 'pro';
          await this.billingService.handleSubscriptionUpdated(
            sub.customer,
            sub.id,
            plan,
            sub.status,
            sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          );
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as any;
          await this.billingService.handleSubscriptionDeleted(sub.customer);
          break;
        }
      }
    } catch (err: any) {
      this.logger.error('Webhook processing error', err.message);
    }

    return res.status(200).json({ received: true });
  }
}
