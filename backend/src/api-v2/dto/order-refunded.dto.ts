import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class OrderRefundedDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsOptional()
  refundAmount?: number;
}
