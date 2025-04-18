import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Obtener todas las consultas
  async getAllConsultas() {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Obtener consultas pendientes
  async getPendingConsultations() {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef.where('estado', '==', 'pendiente').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Obtener casos activos de un usuario
  async getActiveCases(uid: string) {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef
      .where('userId', '==', uid)
      .where('estado', '==', 'activo')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    if (!status) {
      throw new Error('El estado es obligatorio');
    }

    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    await consultaRef.update({ estado: status });

    // Si el estado es "Aprobado", convertirlo en un caso activo
    if (status === 'Aprobado') {
      await consultaRef.update({ tipo: 'caso', estado: 'activo', fechaActualizacion: Timestamp.now() });
    }
    return { status: 'success', message: `Estado actualizado a ${status}` };
  }

  // Asignar un abogado a un caso
  async assignCase(consultaId: string, userId: string) {
    if (!userId) {
      throw new Error('El ID del usuario es obligatorio para asignar el caso');
    }

    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    await consultaRef.update({
      responsableCaso: userId,
      estado: 'asignado',
      fechaAsignacion: Timestamp.now()
    });
    return { status: 'success', message: `Caso asignado a ${userId}` };
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
