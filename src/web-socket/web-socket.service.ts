import { Injectable } from '@nestjs/common';
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
      try {
        this.server.to(userId).emit('newMessage', message);
        console.log(`Mensaje enviado a ${userId}`);
      } catch (error) {
        console.error('Error al enviar mensaje a usuario:', error);
      }
    } else {
      console.error('Server not initialized');
    }
  }

  // Enviar mensaje a todos los usuarios conectados a un caso específico
  sendMessageToCase(caseId: string, message: string) {
    if (this.server) {
      try {
        this.server.to(caseId).emit('newMessage', message);
        console.log(`Mensaje enviado al caso ${caseId}`);
      } catch (error) {
        console.error('Error al enviar mensaje al caso:', error);
      }
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

  // Unir un cliente a una sala (por ejemplo, un caso específico)
  joinCase(client: Socket, caseId: string) {
    client.join(caseId);
    console.log(`Client ${client.id} joined case: ${caseId}`);
  }

  // Dejar un cliente de una sala
  leaveCase(client: Socket, caseId: string) {
    client.leave(caseId);
    console.log(`Client ${client.id} left case: ${caseId}`);
  }
}
