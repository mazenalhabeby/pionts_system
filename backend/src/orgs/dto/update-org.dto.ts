import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateOrgDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
