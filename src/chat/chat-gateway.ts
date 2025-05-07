import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service'; // Servicio para manejar la persistencia de los mensajes

@WebSocketGateway(3002, { 
  cors: { 
    origin: '*' 
  } 
})


@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('Socket server iniciado🕯️');
  }

  handleConnection(client: any, ...args: any[]) {
    console.log('Cliente conectado🧨');
  }

  handleDisconnect(client: any, ...args: any[]) {
    console.log('Cliente desconectado💥');
  }
  @SubscribeMessage('event_join')
  handleJoinRoom(client: Socket, room: string) {
    client.join(`room_${room}`);
  }

  @SubscribeMessage('event_message') //TODO Backend
  handleIncommingMessage(
    client: Socket,
    payload: { room: string; message: string },
  ) {
    const { room, message } = payload;
    console.log(payload)
    this.server.to(`room_${room}`).emit('new_message',message);
  }

  @SubscribeMessage('event_leave')
  handleRoomLeave(client: Socket, room:string) {
    console.log(`chao room_${room}`)
    client.leave(`room_${room}`);
  }
}
