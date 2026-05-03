import { IsNumber, Min } from 'class-validator';

export class RedeemDto {
  @IsNumber()
  @Min(1)
  points: number;
}
