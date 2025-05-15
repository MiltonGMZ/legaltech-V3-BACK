import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComentarioDto {
  @ApiProperty({ description: 'El comentario sobre el caso' })
  comentario: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Archivo de evidencia (opcional)' })
  archivo?: any; // El archivo será enviado como multipart/form-data
}
