import { BadRequestException } from '@nestjs/common';
import { LIMITS } from '../common/constants';

interface ParsedBirthday {
  month: number;
  day: number;
  year?: number;
}

/**
 * Parses a birthday string in YYYY-MM-DD or MM-DD format.
 * Validates month/day ranges and throws BadRequestException on invalid input.
 */
export function parseBirthday(value: string): ParsedBirthday {
  const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const isLegacyDate = /^\d{2}-\d{2}$/.test(value);

  if (!isFullDate && !isLegacyDate) {
    throw new BadRequestException('Birthday must be in YYYY-MM-DD or MM-DD format');
  }

  const parts = value.split('-');
  let year: number | undefined;
  let month: number;
  let day: number;

  if (isFullDate) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new BadRequestException('Invalid birthday date');
  }

  return { month, day, year };
}

/**
 * Calculates age from a date-of-birth string (YYYY-MM-DD).
 */
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validates that a full YYYY-MM-DD birthday yields a reasonable age.
 * Throws BadRequestException if age is out of [minAge, maxAge] range.
 */
export function validateBirthdayAge(
  year: number,
  month: number,
  day: number,
  minAge = LIMITS.MIN_AGE_GENERAL,
  maxAge = LIMITS.MAX_AGE_GENERAL,
): void {
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < minAge || age > maxAge) {
    throw new BadRequestException('Invalid birth date');
  }
}
