import { IsEmail, IsString, IsIn } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['owner', 'member'])
  role: string;
}
