import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';

export enum RolComentario {
  USUARIO = 'usuario',
  ABOGADO = 'abogado',
}

export class CreateComentarioDto {
  @ApiProperty({ description: 'Texto del comentario' })
  @IsNotEmpty()
  @IsString()
  texto: string;

  @ApiPropertyOptional({ description: 'URL de la evidencia asociada' })
  @IsOptional()
  @IsString()
  archivoUrl?: string;

  @ApiProperty({ description: 'ID del autor del comentario' })
  @IsNotEmpty()
  @IsString()
  autorId: string;

  @ApiProperty({ enum: RolComentario, description: 'Rol del autor' })
  @IsNotEmpty()
  @IsEnum(RolComentario)
  rol: RolComentario;

  @ApiPropertyOptional({ description: 'Fecha del comentario en formato ISO' })
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
