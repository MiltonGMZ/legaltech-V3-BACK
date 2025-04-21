import { Controller, Post, Get, Param, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateMensajeDto } from './dtos/create-mensaje.dto';
import { WebSocketService } from 'src/web-socket/web-socket.service';


@ApiTags('Mensajes')
@Controller('mensajes')
export class MensajesController {
  constructor(
    private readonly mensajesService: MensajesService,
    private readonly webSocketService: WebSocketService, 
  ) {}

  /**
   * Enviar un mensaje en un caso entre el abogado y el usuario.
   * @param casoId ID del caso en el que se envía el mensaje
   * @param createMensajeDto Contenido del mensaje que incluye el ID del remitente (abogado o usuario) y el mensaje
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

    // Verifica que se haya proporcionado un senderId y un mensaje no vacío
    if (!senderId || !message.trim()) {
      throw new BadRequestException('El mensaje o el ID del remitente están vacíos');
    }

    // Llamamos al servicio para guardar el mensaje en Firestore
    await this.mensajesService.sendMessageToCase(casoId, senderId, message);

    // Emitimos el mensaje a todos los participantes del caso (a través de WebSocket)
    this.webSocketService.sendMessageToCase(casoId, message);

    return { message: 'Mensaje enviado correctamente' };
  }

  /**
   * Obtener todos los mensajes de un caso específico.
   * @param casoId ID del caso para obtener los mensajes
   */
  @Get(':casoId')
  @ApiOperation({ summary: 'Obtener los mensajes de un caso' })
  @ApiParam({ name: 'casoId', description: 'ID del caso' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'No se encontraron mensajes' })
  async getMessages(@Param('casoId') casoId: string) {
    // Obtenemos los mensajes asociados a un caso
    const mensajes = await this.mensajesService.getMessagesFromCase(casoId);
    
    // Si no se encuentran mensajes, lanzamos una excepción
    if (!mensajes || mensajes.length === 0) {
      throw new NotFoundException('No se encontraron mensajes para este caso');
    }
    
    return { mensajes };
  }
}
