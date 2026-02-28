import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AwardDeductDto {
  @IsNumber()
  @Min(1)
  points: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
