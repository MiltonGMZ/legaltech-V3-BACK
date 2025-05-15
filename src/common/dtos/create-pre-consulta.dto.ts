import { IsNotEmpty, IsEmail, IsString, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export enum EstadoConsulta {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  ACTIVO = 'activo',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
  ASIGNADO = 'asignado',
  NOTIFICADO = 'notificado',
}

export enum TipoConsulta {
  PRECONSULTA = 'preconsulta',
  CASO = 'caso',
}

export class CreatePreConsultaDto {
  @IsOptional()
  @IsString()
  abogadoId?: string;

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
  fechaNacimiento: string;  // ISO 8601 string

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
  @IsEnum(EstadoConsulta)
  estado?: EstadoConsulta;

  @IsNotEmpty()
  @IsEnum(TipoConsulta)
  tipo: TipoConsulta;

  @IsOptional()
  @IsString()
  responsableCaso?: string;

  @IsOptional()
  @IsBoolean()
  notificado?: boolean;

  @IsOptional()
  fechaCreacion?: Date | string;
}
