import { IsString, IsNotEmpty } from 'class-validator';

export class CheckoutValidateDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
