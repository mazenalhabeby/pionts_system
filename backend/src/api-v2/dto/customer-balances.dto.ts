import { IsArray, IsEmail, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class CustomerBalancesDto {
  /**
   * Emails to look up. Scoped to the calling project (store) — only customers
   * that belong to this project are returned; unknown emails are omitted.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsEmail({}, { each: true })
  emails: string[];
}
