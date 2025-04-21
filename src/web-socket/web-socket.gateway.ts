import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { WebSocketService } from './web-socket.service';
import { CreateWebSocketDto } from './dto/create-web-socket.dto';

@WebSocketGateway()
export class MensajesWebSocketGateway {
  constructor(private readonly webSocketService: WebSocketService) {}


 afterInit(server) {
  this.webSocketService.setServer(server); 
}

// Aquí va la lógica de los mensajes entrantes
@SubscribeMessage('sendMessage')
handleSendMessage(@MessageBody() message: string) {
  // Enviar el mensaje a un usuario específico
  this.webSocketService.sendMessageToUser('userId123', message);
}
}
export { WebSocketGateway };

