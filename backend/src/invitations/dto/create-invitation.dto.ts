import { IsEmail, IsIn, IsOptional, IsInt } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsIn(['owner', 'member', 'admin', 'editor', 'viewer'])
  role: string;

  @IsOptional()
  @IsInt()
  projectId?: number;
}
