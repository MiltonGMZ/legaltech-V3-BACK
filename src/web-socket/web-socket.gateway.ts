import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { WebSocketService } from './web-socket.service';
import { CreateWebSocketDto } from './dto/create-web-socket.dto';
import { Socket } from 'socket.io';
import { HttpException, HttpStatus } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200', // Permitir solicitudes desde el frontend
    methods: ['GET', 'POST'],
  },
})
export class MensajesWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly webSocketService: WebSocketService) {}

  // Inicialización del servidor WebSocket
  afterInit(server) {
    this.webSocketService.setServer(server);
  }

  // Manejo de la conexión de un cliente
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    // Aquí puedes asociar el cliente con su userId o caseId si es necesario
  }

  // Manejo de la desconexión de un cliente
  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    // Puedes hacer limpieza si es necesario, como eliminar registros de la conexión del cliente
  }

  // Lógica para recibir y enviar un mensaje a un usuario específico
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createWebSocketDto: CreateWebSocketDto, 
    @ConnectedSocket() client: Socket
  ) {
    const { caseId, senderId, message } = createWebSocketDto;

    // Validar que los datos del mensaje estén completos
    if (!caseId || !senderId || !message) {
      throw new HttpException('Faltan datos en el mensaje', HttpStatus.BAD_REQUEST);
    }

    try {
      // Enviar el mensaje al caso específico
      await this.webSocketService.sendMessageToCase(caseId, message);

      // Emitir el mensaje al remitente
      await this.webSocketService.sendMessageToUser(senderId, message);

      return { message: 'Mensaje enviado correctamente' };
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw new HttpException('Error al enviar el mensaje', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
