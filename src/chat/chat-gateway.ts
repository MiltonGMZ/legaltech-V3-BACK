import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service'; // Servicio para manejar la persistencia de los mensajes

@WebSocketGateway(3002, { cors: { origin: '*' } })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Guardar mensaje en la base de datos y emitir a los clientes conectados
  @SubscribeMessage('newMessage')
 

  async handleNewMessage(@MessageBody() data: { consultaId: string, userId: string, abogadoId: string, message: string }) {
    const { consultaId, userId, abogadoId, message } = data;

    // Validar si el usuario tiene permisos para enviar el mensaje
    const valid = await this.chatService.validateUserForMessage(consultaId, userId, abogadoId);
    if (!valid) {
      return this.server.emit('error', 'No tienes permiso para enviar un mensaje en este caso.');
    }

    // Crear objeto CreateMessageDto
    const createMessageDto = { consultaId, userId, abogadoId, message };

    // Guardar mensaje en la base de datos
    await this.chatService.saveMessage(createMessageDto);

    // Emitir el mensaje a los clientes conectados al caso
    this.server.to(consultaId).emit('message', { userId, message });
  }

  // Método cuando un cliente se conecta
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  // Método cuando un cliente se desconecta
  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }
}
