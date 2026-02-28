import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'paused'])
  status?: string;

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
