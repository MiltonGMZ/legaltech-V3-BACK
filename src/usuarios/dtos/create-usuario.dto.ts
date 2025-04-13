import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}
