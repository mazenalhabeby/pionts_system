import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;

  @IsString()
  @IsOptional()
  @IsIn(['shopify', 'wordpress', 'custom', 'other'])
  platform?: string;

  @IsBoolean()
  @IsOptional()
  pointsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  referralsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  partnersEnabled?: boolean;
}
