import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  referred_by?: string;
}
