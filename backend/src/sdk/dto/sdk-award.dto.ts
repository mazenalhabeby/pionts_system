import { IsString, IsNotEmpty } from 'class-validator';

export class SdkAwardDto {
  @IsString()
  @IsNotEmpty()
  type: string;
}
