import { IsNumber } from 'class-validator';

export class RedeemDto {
  @IsNumber()
  tier_points: number;
}
