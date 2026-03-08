import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const PLATFORM_URL_PATTERNS: Record<string, RegExp> = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/i,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/(c\/|channel\/|user\/|@)[\w-]+|youtu\.be\/[\w-]+)\/?$/i,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+\/?$/i,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/i,
  website: /^https?:\/\/.+\..+$/i,
};

@ValidatorConstraint({ async: false })
export class IsValidSocialMediaUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments): boolean {
    if (!url || typeof url !== 'string') return false;

    const object = args.object as any;
    const platform = object.platform;

    if (!platform) return false;

    const pattern = PLATFORM_URL_PATTERNS[platform];
    if (!pattern) {
      // If platform not recognized, just validate it's a valid URL
      return /^https?:\/\/.+\..+$/.test(url);
    }

    return pattern.test(url);
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const platform = object.platform || 'social media';
    return `URL is not a valid ${platform} profile link`;
  }
}

export function IsValidSocialMediaUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSocialMediaUrlConstraint,
    });
  };
}
