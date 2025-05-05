import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { CreateMessageDto } from './dtos/create-message.dto';

@Injectable()
export class ChatService {
  private firestore: Firestore;

  constructor(private readonly firebaseService: FirebaseService) {
    this.firestore = firebaseService.getFirestore();
  }

  // Método para validar si un usuario puede enviar un mensaje en el caso específico
  async validateUserForMessage(consultaId: string, userId: string, abogadoId: string): Promise<boolean> {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();

    if (!consultaSnapshot.exists) {
      throw new HttpException('Consulta no encontrada', HttpStatus.NOT_FOUND);
    }

    const consulta = consultaSnapshot.data();

    // Validación: El mensaje solo puede ser enviado por el usuario o el abogado asignado
    if (consulta.userId === userId || consulta.abogadoId === abogadoId) {
      return true; // Usuario válido para enviar mensaje
    }

    return false; // Usuario no autorizado
  }

  // Guardar un mensaje
  async saveMessage(createMessageDto: CreateMessageDto) {
    const { consultaId, userId, abogadoId, message } = createMessageDto;

    // Verificar si el usuario tiene permisos para enviar el mensaje
    const valid = await this.validateUserForMessage(consultaId, userId, abogadoId);
    if (!valid) {
      throw new HttpException('No tienes permiso para enviar un mensaje en este caso', HttpStatus.FORBIDDEN);
    }

    // Preparar el mensaje a guardar
    const messageDoc = {
      consultaId,
      userId,
      abogadoId,
      message,
      timestamp: Timestamp.now(),
    };

    try {
      // Guardar el mensaje en la colección 'mensajes'
      const messagesRef = this.firestore.collection('mensajes');
      const docRef = await messagesRef.add(messageDoc);
      return { id: docRef.id, message: 'Mensaje enviado correctamente' };
    } catch (error) {
      // Manejo de errores con más información
      throw new HttpException(`Error al enviar el mensaje: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Obtener mensajes de un caso
  async getMessages(consultaId: string) {
    const messagesRef = this.firestore.collection('mensajes');
    const snapshot = await messagesRef.where('consultaId', '==', consultaId).get();

    // Comprobar si hay mensajes
    if (snapshot.empty) {
      throw new HttpException('No se encontraron mensajes para este caso', HttpStatus.NOT_FOUND);
    }

    // Mapear los mensajes obtenidos
    return snapshot.docs.map(doc => doc.data());
  }
}
