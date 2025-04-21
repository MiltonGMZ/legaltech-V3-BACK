import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WebSocketService } from 'src/web-socket/web-socket.service';

@Injectable()
export class MensajesService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly webSocketService: WebSocketService
  ) {}

  // Enviar mensaje entre abogado y cliente
  async sendMessageToCase(casoId: string, senderId: string, message: string) {
    
    const mensajeRef = this.firebaseService
      .getFirestore()
      .collection('consultas')
      .doc(casoId)
      .collection('mensajes');
    
    // Creamos el objeto del mensaje
    const mensaje = {
      senderId,  
      message,  
      timestamp: new Date(), 
      type: senderId === 'abogadoId' ? 'abogado' : 'usuario', // Determinamos el tipo de mensaje
    };

    // Guardamos el mensaje en la base de datos
    await mensajeRef.add(mensaje);

    
    // Alternamos el receptor dependiendo de quien envió el mensaje
    const receiverId = senderId === 'abogadoId' ? 'usuarioId' : 'abogadoId';
    
   
    this.webSocketService.sendMessageToUser(receiverId, message);
  }

  // Obtener todos los mensajes de un caso
  async getMessagesFromCase(casoId: string) {
    const mensajeRef = this.firebaseService
      .getFirestore()
      .collection('consultas')
      .doc(casoId)
      .collection('mensajes');
    
    // Recuperamos los mensajes de la base de datos
    const snapshot = await mensajeRef.get();
    return snapshot.docs.map(doc => doc.data());
  }
}
