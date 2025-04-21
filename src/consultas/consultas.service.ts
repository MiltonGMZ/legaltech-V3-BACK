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

  async updateConsultaStatus(consultaId: string, status: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
  
    // Lista de estados permitidos
    const allowedStatuses = ['pendiente', 'aprobado', 'rechazado', 'activo', 'resuelto', 'cerrado'];
  
    // Verificar que el estado es válido
    if (!allowedStatuses.includes(status)) {
      throw new Error('Estado no permitido');
    }
  
    // Obtener el documento para verificar si existe
    const consultaSnapshot = await consultaRef.get();
    if (!consultaSnapshot.exists) {
      throw new Error(`Consulta con ID ${consultaId} no encontrada`);
    }
  
    // Si el estado es aprobado, también cambiamos el tipo a "caso"
    if (status === 'aprobado') {
      await consultaRef.update({
        estado: status,
        tipo: 'caso', // Convertir a un caso
        fechaActualizacion: Timestamp.now(),
      });
    } else {
      // Si no es aprobado, solo actualizamos el estado
      await consultaRef.update({
        estado: status,
        fechaActualizacion: Timestamp.now(),
      });
    }
  
    return {
      status: 'success',
      message: `El estado del caso #${consultaId} ha sido actualizado a ${status}.`,
    };
  }
  

  async activateCase(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();
  
    if (!consultaSnapshot.exists) {
      throw new NotFoundException(`Consulta con ID ${consultaId} no encontrada`);
    }
  
    // Verificamos si el caso ya está asignado
    const caseData = consultaSnapshot.data();
    if (caseData.estado !== 'asignado') {
      throw new HttpException('El caso debe estar asignado antes de activarse', HttpStatus.BAD_REQUEST);
    }
  
    // Cambiar el estado a 'activo'
    await consultaRef.update({
      estado: 'activo',
      fechaActualizacion: Timestamp.now(),
    });
  
    return {
      status: 'success',
      message: `El caso #${consultaId} ha sido activado y está siendo trabajado.`,
    };
  }
  
  

  async assignCase(consultaId: string, userId: string) {
    if (!consultaId || !userId) {
      throw new Error('El ID de la consulta y el ID del usuario son obligatorios');
    }
  
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();
  
    if (!consultaSnapshot.exists) {
      throw new Error(`No se encontró el caso con ID ${consultaId}`);
    }
  
    // Obtener los detalles del abogado para incluir el fullName
    const userRef = this.firestore.collection('users').doc(userId);
    const userSnapshot = await userRef.get();
  
    if (!userSnapshot.exists) {
      throw new Error(`No se encontró el usuario con ID ${userId}`);
    }
  
    const abogado = userSnapshot.data();
  
    // Actualiza el responsableCaso con el nombre del abogado y el abogadoId
    await consultaRef.update({
      abogadoId: userId, // Guardamos el uid del abogado
      responsableCaso: abogado.fullName,  // Guardamos el nombre completo del abogado
      estado: 'asignado',  // Actualizamos el estado del caso
      fechaAsignacion: Timestamp.now(),  
    });
  
    return {
      status: 'success',
      message: `El caso #${consultaId} ha sido asignado al abogado ${abogado.fullName}`,
    };
  }
  
  
  
  // ConsultasService (Backend)
async getAssignedCases(abogadoId: string) {
  const consultasRef = this.firestore.collection('consultas');
  const snapshot = await consultasRef
    .where('abogadoId', '==', abogadoId)  // Filtramos por el ID del abogado
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
