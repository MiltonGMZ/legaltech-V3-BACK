import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebSocketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  caseId: string; 

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senderId: string; 

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)  // Limita la longitud del mensaje, si es necesario
  message: string; 
}
