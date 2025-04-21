import { Injectable } from '@nestjs/common';
import { CreateWebSocketDto } from './dto/create-web-socket.dto';
import { UpdateWebSocketDto } from './dto/update-web-socket.dto';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebSocketService {
  private server: Server;
  
  constructor() {}

  // Inicializa el servidor WebSocket
  public setServer(server: Server) {
    this.server = server;
  }

  // Enviar mensaje a un usuario específico
  sendMessageToUser(userId: string, message: string) {
    if (this.server) {
      
      this.server.to(userId).emit('newMessage', message);
    } else {
      console.error('Server not initialized');
    }
  }

  // Conectar a un cliente WebSocket
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Desconectar cliente WebSocket
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

}
