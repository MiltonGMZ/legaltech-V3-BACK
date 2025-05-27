// cita.dto.ts
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TipoCita {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
}

export class CreateCitaDto {
  @IsNotEmpty()
  @IsString()
  clienteId: string;

  @IsNotEmpty()
  @IsDateString()
  fechaHora: string;

  @IsNotEmpty()
  @IsEnum(TipoCita)
  tipo: TipoCita;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateCitaDto {
  @IsOptional()
  @IsDateString()
  fechaHora?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}