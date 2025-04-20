import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString({ each: true })
  role?: string | { id: string };

  @IsOptional()
  uid?: string;

  @IsOptional()
  createdAt?: Date;
}