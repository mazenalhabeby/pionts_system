import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateDiscountDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
