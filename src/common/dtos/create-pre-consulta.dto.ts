import { IsNotEmpty, IsEmail, IsString, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export class CreatePreConsultaDto {
  @IsOptional()
  @IsString()
  abogadoId: string;

  @IsNotEmpty()
  @IsString()
  tipoInvolucrado: string;

  @IsNotEmpty()
  @IsString()
  tipoDocumento: string;

  @IsNotEmpty()
  @IsString()
  nombres: string;

  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @IsNotEmpty()
  @IsString()
  numeroIdentificacion: string;

  @IsNotEmpty()
  @IsDateString()
  fechaNacimiento: string;  // Fecha en formato ISO 8601

  @IsNotEmpty()
  @IsString()
  genero: string;

  @IsNotEmpty()
  @IsEmail()
  correo: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  discapacidad?: string;

  @IsOptional()
  @IsString()
  etnia?: string;

  @IsOptional()
  @IsString()
  desplazado?: string;

  @IsOptional()
  @IsString()
  otro?: string;

  @IsNotEmpty()
  @IsString()
  hechos: string;

  @IsNotEmpty()
  @IsString()
  pretenciones: string;

  @IsNotEmpty()
  @IsBoolean()
  autorizaDatos: boolean;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'activo' | 'resuelto' | 'cerrado' | 'asignado';

  @IsNotEmpty()
  @IsString()
  tipo: 'preconsulta' | 'caso';

  @IsOptional()
  @IsString()
  responsableCaso?: string;

  @IsOptional()
  @IsString()
  notificado?: boolean;

  fechaCreacion: Date;
}
