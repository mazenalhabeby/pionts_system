import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SdkSignupDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  referral_code?: string;
}
