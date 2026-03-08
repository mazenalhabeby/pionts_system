import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidIBAN } from 'ibantools';

@ValidatorConstraint({ async: false })
export class IsValidIBANConstraint implements ValidatorConstraintInterface {
  validate(iban: string): boolean {
    if (!iban || typeof iban !== 'string') return false;
    // Remove spaces and validate
    const normalized = iban.replace(/\s/g, '').toUpperCase();
    return isValidIBAN(normalized);
  }

  defaultMessage(): string {
    return 'IBAN is not valid';
  }
}

export function IsValidIBAN(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIBANConstraint,
    });
  };
}
