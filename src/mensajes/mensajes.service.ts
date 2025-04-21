import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WebSocketService } from 'src/web-socket/web-socket.service';

@Injectable()
export class MensajesService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly webSocketService: WebSocketService
  ) {}

 

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
  const consultaRef = this.firebaseService.getFirestore().collection('consultas').doc(casoId);
  const consultaDoc = await consultaRef.get();
  
  if (!consultaDoc.exists) {
    throw new Error('Caso no encontrado');
  }

  const caseData = consultaDoc.data();

  const receiverId = senderId === caseData.abogadoId ? caseData.userId : caseData.abogadoId;

  // Emitimos el mensaje al usuario correspondiente
  this.webSocketService.sendMessageToUser(receiverId, message);
}


  // Método para verificar si hay mensajes nuevos
async checkNewMessages(userId: string) {
  const consultasRef = this.firebaseService.getFirestore().collection('consultas');
  const snapshot = await consultasRef
    .where('userId', '==', userId)
    .where('estado', '==', 'activos')
    .get();

  // Usamos Promise.all para hacer todas las consultas de manera paralela
  const promises = snapshot.docs.map(async (doc) => {
    const mensajesRef = doc.ref.collection('mensajes');
    const messagesSnapshot = await mensajesRef.where('read', '==', false).get();
    
    return !messagesSnapshot.empty;
  });

  // Si alguna de las consultas devuelve true, significa que hay mensajes nuevos
  const results = await Promise.all(promises);
  return results.some(result => result === true);
}


  // Obtener todos los mensajes de un caso
  async getMessagesFromCase(casoId: string) {
    const mensajeRef = this.firebaseService
      .getFirestore()
      .collection('consultas')
      .doc(casoId)
      .collection('mensajes');
    
    // Recuperamos los mensajes de la base de datos ordenados por timestamp
    const snapshot = await mensajeRef.orderBy('timestamp').get();
    return snapshot.docs.map(doc => doc.data());
  }
}
