import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CheckoutMarkUsedDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}
