import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { MensajesService } from './mensajes.service';

import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateMensajeDto } from './dtos/create-mensaje.dto';

@ApiTags('Mensajes')
@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  /**
   * Crear un nuevo mensaje entre abogado y usuario
   * @param casoId ID del caso en el que se envía el mensaje
   * @param senderId ID del remitente (abogado o usuario)
   * @param message Contenido del mensaje
   */
  @Post(':casoId')
  @ApiOperation({ summary: 'Enviar un mensaje en un caso' })
  @ApiParam({ name: 'casoId', description: 'ID del caso' })
  @ApiBody({ type: CreateMensajeDto })
  @ApiResponse({ status: 201, description: 'Mensaje enviado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al enviar el mensaje' })
  async sendMessage(
    @Param('casoId') casoId: string,
    @Body() createMensajeDto: CreateMensajeDto
  ) {
    const { senderId, message } = createMensajeDto;
    await this.mensajesService.sendMessageToCase(casoId, senderId, message);
    return { message: 'Mensaje enviado correctamente' };
  }

  /**
   * Obtener todos los mensajes de un caso específico
   * @param casoId ID del caso para obtener los mensajes
   */
  @Get(':casoId')
  @ApiOperation({ summary: 'Obtener los mensajes de un caso' })
  @ApiParam({ name: 'casoId', description: 'ID del caso' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'No se encontraron mensajes' })
  async getMessages(@Param('casoId') casoId: string) {
    const mensajes = await this.mensajesService.getMessagesFromCase(casoId);
    if (!mensajes || mensajes.length === 0) {
      throw new NotFoundException('No se encontraron mensajes para este caso');
    }
    return { mensajes };
  }
}
