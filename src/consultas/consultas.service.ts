import {
  HttpStatus,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { CreatePreConsultaDto } from 'src/common/dtos/create-pre-consulta.dto';

const currentTimestamp = Timestamp.now();

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
      fechaCreacion: currentTimestamp,
      estado: createPreConsultaDto.estado || 'pendiente',
      tipo: createPreConsultaDto.tipo || 'preconsulta',
    };

    try {
      const docRef = await consultasRef.add(consultaDoc);
      return { id: docRef.id, message: 'Consulta creada correctamente' };
    } catch (error) {
      // Manejo de errores con más información
      throw new HttpException(
        `Error al crear la consulta: ${error.message}. Verifique los datos enviados.`,
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
      fechaResolucion: currentTimestamp,
    });
    return {
      status: 'success',
      message: `El caso #${consultaId} ha sido marcado como resuelto.`,
    };
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
      throw new HttpException('Consulta no encontrada', HttpStatus.NOT_FOUND);
    }
    return { id: consultaSnapshot.id, ...consultaSnapshot.data() };
  }

  async updateConsultaStatus(consultaId: string, status: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);

    // Lista de estados permitidos
    const allowedStatuses = [
      'pendiente',
      'aprobado',
      'rechazado',
      'activo',
      'resuelto',
      'cerrado',
      'asignado',
    ];

    // Verificar que el estado es válido
    if (!allowedStatuses.includes(status)) {
      throw new HttpException(
        `El estado "${status}" no es válido. Los estados permitidos son: ${allowedStatuses.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Obtener el documento para verificar si existe
    const consultaSnapshot = await consultaRef.get();
    if (!consultaSnapshot.exists) {
      throw new HttpException(
        `Consulta con ID ${consultaId} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Si el estado es aprobado, también cambiamos el tipo a "caso"
    if (status === 'aprobado') {
      await consultaRef.update({
        estado: status,
        tipo: 'caso', // Convertir a un caso
        fechaActualizacion: currentTimestamp,
      });
    } else {
      // Si no es aprobado, solo actualizamos el estado
      await consultaRef.update({
        estado: status,
        fechaActualizacion: currentTimestamp,
      });
    }

    return {
      status: 'success',
      message: `El estado del caso #${consultaId} ha sido actualizado a ${status}.`,
    };
  }

  async assignCase(consultaId: string, userId: string) {
    this.validateInput(consultaId, userId);
  
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await this.getDocument(consultaRef, 'consulta', consultaId);
  
    // Verificar si el caso ya está asignado
    if (consultaSnapshot.data()?.abogadoId) {
      throw new HttpException('Este caso ya tiene un abogado asignado', HttpStatus.CONFLICT);
    }
  
    const abogado = await this.getUser(userId);
  
    // Actualiza el responsableCaso con el nombre del abogado y el abogadoId
    await consultaRef.update({
      abogadoId: userId,
      responsableCaso: abogado.fullName,
      estado: 'asignado',
      fechaAsignacion: currentTimestamp,
    });
  
    return {
      status: 'success',
      message: `El caso #${consultaId} ha sido asignado al abogado ${abogado.fullName}`,
    };
  }
  
  private validateInput(consultaId: string, userId: string) {
    if (!consultaId || !userId) {
      throw new HttpException('El ID de la consulta y el ID del usuario son obligatorios', HttpStatus.BAD_REQUEST);
    }
  }
  
  private async getDocument(ref: FirebaseFirestore.DocumentReference, entity: string, id: string) {
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new HttpException(`${entity.charAt(0).toUpperCase() + entity.slice(1)} con ID ${id} no encontrada`, HttpStatus.NOT_FOUND);
    }
    return snapshot;
  }
  
  private async getUser(userId: string) {
    const userRef = this.firestore.collection('users').doc(userId);
    const userSnapshot = await this.getDocument(userRef, 'usuario', userId);
    const abogado = userSnapshot.data();
    
    if (!abogado?.fullName) {
      throw new HttpException('El abogado no tiene un nombre completo registrado', HttpStatus.NOT_FOUND);
    }
  
    return abogado;
  }
  

  async getAssignedCases(abogadoId: string) {
    const consultasRef = this.firestore.collection('consultas');
    const snapshot = await consultasRef
      .where('abogadoId', '==', abogadoId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fechaCreacion: data.fechaCreacion ? data.fechaCreacion.toDate() : null,
        ...data,
      };
    });
  }

  async activateCase(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();

    if (!consultaSnapshot.exists) {
      throw new HttpException(
        `Consulta con ID ${consultaId} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Verificamos si el caso ya está asignado
    const caseData = consultaSnapshot.data();
    if (caseData.estado !== 'asignado') {
      throw new HttpException(
        'El caso debe estar asignado antes de activarse',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cambiar el estado a 'activo'
    await consultaRef.update({
      estado: 'activo',
      fechaActualizacion: currentTimestamp,
    });

    return {
      status: 'success',
      message: `El caso #${consultaId} ha sido activado y está siendo trabajado.`,
    };
  }

  // Método para rechazar un caso
  async rejectCase(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);

    const consultaSnapshot = await consultaRef.get();
    if (!consultaSnapshot.exists) {
      throw new HttpException('Consulta no encontrada', HttpStatus.NOT_FOUND);
    }

    // Actualizar el estado del caso a "rechazado"
    await consultaRef.update({
      estado: 'rechazado',
      fechaActualizacion: currentTimestamp,
    });

    return { message: `El caso con ID ${consultaId} ha sido rechazado.` };
  }
}
