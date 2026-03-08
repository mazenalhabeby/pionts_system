import { IsString, IsArray, ValidateNested, IsOptional, ArrayMinSize, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidIBAN } from '../validators/iban.validator';
import { IsValidSocialMediaUrl } from '../validators/social-url.validator';

class SocialMediaEntry {
  @IsString()
  platform: string;

  @IsString()
  @IsValidSocialMediaUrl()
  url: string;

  @IsOptional()
  @IsString()
  followers?: string;
}

export class SdkPartnerApplyDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  dateOfBirth: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SocialMediaEntry)
  socialMedia: SocialMediaEntry[];

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsString()
  @IsValidIBAN({ message: 'IBAN format is invalid. Please check and try again.' })
  iban: string;
}
