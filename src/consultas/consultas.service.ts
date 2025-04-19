import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { CreatePreConsultaDto } from 'src/common/dtos/create-pre-consulta.dto';

@Injectable()
export class ConsultasService {
  private firestore: Firestore;

  constructor(private readonly firebaseService: FirebaseService) {
    this.firestore = firebaseService.getFirestore();
  }

  // Crear una nueva consulta
  async saveConsulta(createPreConsultaDto: CreatePreConsultaDto) {
    const consultasRef = this.firestore.collection('consultas');

    // Asegúrate de que la consulta tenga el estado y tipo correctos
    const consultaDoc = {
      ...createPreConsultaDto,
      fechaCreacion: Timestamp.now(),
      estado: createPreConsultaDto.estado || 'pendiente',
      tipo: createPreConsultaDto.tipo || 'preconsulta',
    };

    try {
      const docRef = await consultasRef.add(consultaDoc);
      return { id: docRef.id, message: 'Consulta creada correctamente' };
    } catch (error) {
      // Manejo de errores con más información
      throw new HttpException(
        `Error al crear la consulta: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener todas las consultas
  async getAllConsultas() {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async markCaseAsResolved(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    await consultaRef.update({
      estado: 'resuelto', 
      fechaResolucion: Timestamp.now() 
    });
    return { status: 'success', message: `El caso #${consultaId} ha sido marcado como resuelto.` };
  }
  

  // Obtener consultas pendientes
  async getPendingConsultations() {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef
      .where('estado', '==', 'pendiente')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Obtener casos activos
  async getActiveCases(uid: string) {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef
      .where('userId', '==', uid)
      .where('estado', '==', 'activo')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fechaCreacion: data.fechaCreacion.toDate(),
        ...data,
      };
    });
  }

  // Obtener consulta por ID
  async getConsultaById(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();

    if (!consultaSnapshot.exists) {
      throw new Error('Consulta no encontrada');
    }
    return { id: consultaSnapshot.id, ...consultaSnapshot.data() };
  }

  // Actualizar el estado de una consulta
  async updateConsultaStatus(consultaId: string, status: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
  
    const allowedStatuses = ['pendiente', 'aprobado', 'rechazado', 'activo', 'resuelto', 'cerrado'];
    
    if (!allowedStatuses.includes(status)) {
      throw new Error('Estado no permitido');
    }
  
    await consultaRef.update({
      estado: status,
      fechaActualizacion: Timestamp.now(), 
    });
  
    return { status: 'success', message: `El estado del caso #${consultaId} ha sido actualizado a ${status}.` };
  }
  

  async assignCase(consultaId: string, userId: string) {
    if (!consultaId || !userId) {
      throw new Error(
        'El ID de la consulta y el ID del usuario son obligatorios',
      );
    }

    try {
      const consultaRef = this.firebaseService
        .getFirestore()
        .collection('consultas')
        .doc(consultaId);
      const consultaSnapshot = await consultaRef.get();

      if (!consultaSnapshot.exists) {
        throw new Error(`No se encontró el caso con ID ${consultaId}`);
      }

      await consultaRef.update({
        responsableCaso: userId,
        estado: 'asignado',
        fechaAsignacion: Timestamp.now(),
      });

      return {
        status: 'success',
        message: `El caso #${consultaId} ha sido asignado al abogado ${userId}`,
      };
    } catch (error) {
      console.error('Error al asignar el caso:', error);
      throw new Error(`Error al asignar el caso: ${error.message}`);
    }
  }

  // Método para rechazar un caso
  async rejectCase(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);

    const consultaSnapshot = await consultaRef.get();
    if (!consultaSnapshot.exists) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Actualizar el estado del caso a "rechazado"
    await consultaRef.update({
      estado: 'rechazado',
      fechaActualizacion: Timestamp.now(),
    });

    return { message: `El caso con ID ${consultaId} ha sido rechazado.` };
  }
}
