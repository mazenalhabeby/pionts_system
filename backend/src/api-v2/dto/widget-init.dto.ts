import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class WidgetInitDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}
