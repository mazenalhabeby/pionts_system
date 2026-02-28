import { IsInt, Min } from 'class-validator';

export class SdkRedeemDto {
  @IsInt()
  @Min(1)
  tier_points: number;
}
