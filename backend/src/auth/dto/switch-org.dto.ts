import { IsInt } from 'class-validator';

export class SwitchOrgDto {
  @IsInt()
  orgId: number;
}
