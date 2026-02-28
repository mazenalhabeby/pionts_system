import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CustomersService } from '../customers/customers.service';
import { EmailService } from './email.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { resolveProjectId } from '../common/helpers/project-resolver';

@Controller('api/auth')
export class CustomerAuthController {
  private readonly isDev: boolean;

  constructor(
    private readonly customersService: CustomersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';
  }

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    const projectId = 1; // TODO: resolve from API key in Phase 2
    const customer = await this.customersService.findByEmail(projectId, dto.email);
    if (!customer) {
      throw new NotFoundException('No account found with this email.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await this.customersService.saveVerificationCode(customer.id, code, expiry);

    const sent = await this.emailService.sendVerificationCode(dto.email, code);
    if (!sent) {
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    const response: Record<string, unknown> = { success: true };
    if (this.isDev) {
      response.code = code;
    }
    return response;
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto, @Req() req: Request) {
    const projectId = 1; // TODO: resolve from API key in Phase 2
    const customer = await this.customersService.findByEmail(projectId, dto.email);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (
      !customer.verificationCode ||
      !customer.verificationExpiry ||
      customer.verificationCode !== dto.code
    ) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date(customer.verificationExpiry) < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.customersService.clearVerificationCode(customer.id);

    req.session.customerEmail = dto.email;

    return { success: true };
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  async me(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.resolveFromSession(projectId, req.session);
    return { authenticated: true, email: customer.email, name: customer.name };
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    return new Promise<{ success: boolean }>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }
}
