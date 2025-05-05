import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dtos/create-message.dto';


@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar un mensaje en el chat' })
  @ApiResponse({ status: 200, description: 'Mensaje enviado correctamente' })
  async sendMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.chatService.saveMessage(createMessageDto);
  }

  @Get(':consultaId')
  @ApiOperation({ summary: 'Obtener los mensajes de un caso' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos correctamente' })
  async getMessages(@Param('consultaId') consultaId: string) {
    return this.chatService.getMessages(consultaId);
  }
}
