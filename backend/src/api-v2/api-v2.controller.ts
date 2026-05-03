import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { Project } from '@prisma/client';
import { ApiKeyV2Guard } from './guards/api-key-v2.guard';
import { V2Project } from './decorators/v2-project.decorator';
import { RequireScope } from './decorators/require-scope.decorator';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { CheckoutValidateDto } from './dto/checkout-validate.dto';
import { CheckoutMarkUsedDto } from './dto/checkout-mark-used.dto';
import { OrderPaidDto } from './dto/order-paid.dto';
import { OrderRefundedDto } from './dto/order-refunded.dto';
import { RedeemDto } from './dto/redeem.dto';
import { WidgetInitDto } from './dto/widget-init.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountService } from '../discount/discount.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { CustomersService } from '../customers/customers.service';
import { RedemptionsService } from '../redemptions/redemptions.service';
import { SdkService } from '../sdk/sdk.service';

@Controller('api/v2')
@UseGuards(ApiKeyV2Guard)
@UseInterceptors(AuditLogInterceptor)
@SkipThrottle()
export class ApiV2Controller {
  private readonly logger = new Logger(ApiV2Controller.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly discountService: DiscountService,
    private readonly webhooksService: WebhooksService,
    private readonly customersService: CustomersService,
    private readonly redemptionsService: RedemptionsService,
    private readonly sdkService: SdkService,
  ) {}

  // ==================== Checkout ====================

  @RequireScope('checkout')
  @Post('checkout/validate')
  async checkoutValidate(
    @V2Project() project: Project,
    @Body() dto: CheckoutValidateDto,
  ) {
    const result = await this.discountService.validate(project.id, dto.code);
    return {
      valid: result.valid,
      discountAmount: result.valid ? result.discount_amount : undefined,
      alreadyUsed: result.valid ? result.already_used : undefined,
    };
  }

  @RequireScope('checkout')
  @Post('checkout/mark-used')
  async checkoutMarkUsed(
    @V2Project() project: Project,
    @Body() dto: CheckoutMarkUsedDto,
  ) {
    return this.discountService.markUsed(project.id, dto.code);
  }

  // ==================== Orders ====================

  @Post('orders/paid')
  async orderPaid(
    @V2Project() project: Project,
    @Body() dto: OrderPaidDto,
  ) {
    return this.webhooksService.processOrder(project.id, {
      customer_email: dto.email,
      customer_name: dto.customerName,
      order_id: dto.orderId,
      order_total: dto.orderTotal,
      referral_code: dto.referralCode,
    });
  }

  @Post('orders/refunded')
  async orderRefunded(
    @V2Project() project: Project,
    @Body() dto: OrderRefundedDto,
  ) {
    return this.webhooksService.processRefund(project.id, {
      order_id: dto.orderId,
    });
  }

  // ==================== Customers ====================

  @Get('customers/:email')
  async getCustomer(
    @V2Project() project: Project,
    @Param('email') email: string,
  ) {
    const customer = await this.customersService.findByEmail(project.id, email);
    if (!customer) {
      return { found: false };
    }

    const data = await this.sdkService.getCustomerData(project.id, customer);
    return { found: true, ...data };
  }

  @Post('customers/:email/redeem')
  async redeemPoints(
    @V2Project() project: Project,
    @Param('email') email: string,
    @Body() dto: RedeemDto,
  ) {
    const customer = await this.customersService.findByEmail(project.id, email);
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    return this.redemptionsService.redeemGeneric(
      project.id,
      {
        id: customer.id,
        pointsBalance: customer.pointsBalance,
        referralCode: customer.referralCode,
      },
      dto.points,
    );
  }

  @Delete('customers/:email/redemptions/:id')
  async cancelRedemption(
    @V2Project() project: Project,
    @Param('email') email: string,
    @Param('id') redemptionId: string,
  ) {
    const customer = await this.customersService.findByEmail(project.id, email);
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    return this.redemptionsService.cancelRedemption(
      project.id,
      customer.id,
      Number(redemptionId),
    );
  }

  // ==================== Config ====================

  @Get('config')
  async getConfig(@V2Project() project: Project) {
    return this.sdkService.getProjectConfig(project.id);
  }

  // ==================== Widget ====================

  @Post('widget/init')
  async widgetInit(
    @V2Project() project: Project,
    @Body() dto: WidgetInitDto,
  ) {
    const hmac = crypto
      .createHmac('sha256', project.hmacSecret || '')
      .update(dto.email)
      .digest('hex');

    return {
      projectKey: await this.getPublicKey(project.id),
      hmac,
      apiBase: this.getApiBase(),
      email: dto.email,
      ...(dto.name && { name: dto.name }),
    };
  }

  // ==================== Helpers ====================

  private async getPublicKey(projectId: number): Promise<string> {
    const key = await this.prisma.apiKey.findFirst({
      where: { projectId, type: 'public', revoked: false },
      select: { keyPrefix: true },
    });
    return key?.keyPrefix ?? '';
  }

  private getApiBase(): string {
    // The API base URL for the widget to make SDK calls
    return process.env.APP_URL || process.env.BASE_URL || 'http://localhost:3000';
  }
}
