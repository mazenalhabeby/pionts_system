import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class OrderPaidDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsNumber()
  orderTotal: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  referralCode?: string;
}
