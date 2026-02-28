import { IsIn, IsString } from 'class-validator';

export class AwardTypeDto {
  @IsIn(['review_photo', 'review_text', 'follow_tiktok', 'follow_instagram', 'share_product', 'birthday'])
  @IsString()
  type: string;
}
