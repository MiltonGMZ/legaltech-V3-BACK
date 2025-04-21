import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { WebSocketService } from './web-socket.service';
import { CreateWebSocketDto } from './dto/create-web-socket.dto';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class MensajesWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly webSocketService: WebSocketService) {}

  // Inicialización del servidor WebSocket
  afterInit(server) {
    this.webSocketService.setServer(server);
  }

  // Manejo de la conexión de un cliente
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    // Aquí puedes asociar el cliente con su userId o caseId
  }

  // Manejo de la desconexión de un cliente
  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    // Puedes hacer limpieza si es necesario, como eliminar registros de la conexión del cliente
  }

  // Lógica para recibir y enviar un mensaje a un usuario específico
  @SubscribeMessage('sendMessage')
  handleSendMessage(@MessageBody() createWebSocketDto: CreateWebSocketDto, @ConnectedSocket() client: Socket) {
    const { caseId, senderId, message } = createWebSocketDto;

    // Validar que los datos del mensaje estén completos
    if (!caseId || !senderId || !message) {
      throw new Error('Faltan datos en el mensaje');
    }

    // Enviar el mensaje al caso específico
    this.webSocketService.sendMessageToCase( senderId, message);

    // Emitir el mensaje a todos los usuarios conectados al caso (opcional)
    this.webSocketService.sendMessageToUser(senderId, message); // Enviar al remitente

    return { message: 'Mensaje enviado correctamente' };
  }
}
