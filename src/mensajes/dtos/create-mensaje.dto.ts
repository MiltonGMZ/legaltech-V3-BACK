import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMensajeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  caseId: string;  // ID del caso al que pertenece el mensaje

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senderId: string;  // ID del remitente (abogado o usuario)

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;  // Contenido del mensaje

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timestamp?: string;  // Timestamp en formato ISO 8601, opcional
}
