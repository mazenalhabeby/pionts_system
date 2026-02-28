import { IsOptional, IsString, IsIn } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['day', 'week', 'month'])
  period?: string = 'day';

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
