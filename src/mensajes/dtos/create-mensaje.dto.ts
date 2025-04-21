import { IsString, IsNotEmpty, IsOptional, IsISO8601, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMensajeDto {
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
  @Length(1, 1000)  
  message: string;  

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsISO8601()  
  timestamp?: string; 
}
