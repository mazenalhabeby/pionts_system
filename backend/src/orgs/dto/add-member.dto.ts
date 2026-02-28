import { IsEmail, IsString, IsNotEmpty, MinLength, IsIn, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(['admin', 'member'])
  role: string;
}
