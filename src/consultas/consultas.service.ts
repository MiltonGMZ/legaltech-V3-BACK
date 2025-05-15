import {
  HttpStatus,
  Injectable,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { CreatePreConsultaDto, EstadoConsulta } from 'src/common/dtos/create-pre-consulta.dto';
import { CreateComentarioDto } from 'src/common/dtos/create-comentario.dto';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import * as admin from 'firebase-admin';

const currentTimestamp = Timestamp.now();

@Injectable()
export class ConsultasService {
  private firestore: Firestore;
  

  constructor(
    private readonly firebaseService: FirebaseService, 
    private readonly fileUploadService: FileUploadService) {
    this.firestore = firebaseService.getFirestore();
  }

 async closeCase(consultaId: string) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();

    if (!consultaSnapshot.exists) {
      throw new HttpException('Consulta no encontrada', HttpStatus.NOT_FOUND);
    }

    const consultaData = consultaSnapshot.data();

    // Opcional: validar que el caso no esté ya cerrado o en estado incompatible
    if (consultaData.estado === 'cerrado') {
      throw new HttpException('El caso ya está cerrado', HttpStatus.BAD_REQUEST);
    }

    // Actualizar estado y fecha
    await consultaRef.update({
      estado: 'cerrado',
      fechaActualizacion: Timestamp.now(),
    });

    return { message: `El caso #${consultaId} ha sido cerrado correctamente.` };
  }

// Método común para actualizar el estado y la fecha de actualización
private async updateStateAndDate(consultaRef: any, estado: string, tipo?: string) {
  const currentTimestamp = Timestamp.now(); 
  // Actualiza el estado y fecha de actualización
  const updateData: any = {
    estado,
    fechaActualizacion: currentTimestamp,
  };

  // Si el tipo se proporciona (en el caso de 'aprobado'), actualizamos también el tipo
  if (tipo) {
    updateData.tipo = tipo;
  }

  // Realizamos la actualización
  await consultaRef.update(updateData);
}


async addComentarioWithEvidence(
  caseId: string,
  comentario: string,
  file?: Express.Multer.File,
) {
  const comentariosRef = this.firestore
    .collection('consultas')
    .doc(caseId)
    .collection('comentarios');

  let evidenciaUrl: string | null = null;

  if (file) {
    // Subir archivo y obtener URL
    evidenciaUrl = await this.fileUploadService.uploadFile(caseId, file);
  }

  const nuevoComentario = {
    texto: comentario,
    evidenciaUrl,  // null si no hay archivo
    fecha: admin.firestore.Timestamp.now(),
  };

  await comentariosRef.add(nuevoComentario);

  return { status: 'success', message: 'Comentario con evidencia agregado correctamente.' };
}




  // Crear una nueva consulta
  async saveConsulta(createPreConsultaDto: CreatePreConsultaDto) {
    const consultasRef = this.firestore.collection('consultas');
  
    // Asegúrate de que el estado esté correcto usando el enum
    const estado = createPreConsultaDto.estado || EstadoConsulta.PENDIENTE;
  
    const consultaDoc = {
      ...createPreConsultaDto,
      fechaCreacion: Timestamp.now(),
      estado: estado, // Usar el valor del enum por defecto si no se proporciona uno
      tipo: createPreConsultaDto.tipo || 'preconsulta',
    };
  
    try {
      const docRef = await consultasRef.add(consultaDoc);
      return { id: docRef.id, message: 'Consulta creada correctamente' };
    } catch (error) {
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

  const data = consultaSnapshot.data();

  return {
    id: consultaSnapshot.id,
    ...data,
    fechaCreacion: data?.fechaCreacion ? data.fechaCreacion.toDate() : null,
    comentarios: data?.comentarios || [], 
  };
}


  async updateConsultaStatus(consultaId: string, status: EstadoConsulta) {
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
  
    // Verifica si el estado es válido (esto ya está cubierto por el @IsEnum en el DTO)
    const allowedStatuses = Object.values(EstadoConsulta);  // ['pendiente', 'aprobado', 'rechazado', 'activo', 'resuelto', 'cerrado', 'asignado']
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
  
    // Actualizar el estado
    await consultaRef.update({
      estado: status,
      fechaActualizacion: Timestamp.now(),
    });
  
    return {
      status: 'success',
      message: `El estado del caso #${consultaId} ha sido actualizado a ${status}.`,
    };
  }
  
  

  async assignCase(consultaId: string, userId: string) {
    if (!consultaId || !userId) {
      throw new HttpException(
        'El ID de la consulta y el ID del usuario son obligatorios',
        HttpStatus.BAD_REQUEST,
      );
    }
  
    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    const consultaSnapshot = await consultaRef.get();
  
    // Verificar si el caso ya está asignado
    if (consultaSnapshot.data().abogadoId) {
      throw new HttpException(
        'Este caso ya tiene un abogado asignado',
        HttpStatus.CONFLICT,
      );
    }
  
    if (!consultaSnapshot.exists) {
      throw new HttpException(
        `No se encontró el caso con ID ${consultaId}`,
        HttpStatus.NOT_FOUND,
      );
    }
  
    // Obtener los detalles del abogado para incluir el fullName
    const userRef = this.firestore.collection('users').doc(userId);
    const userSnapshot = await userRef.get();
  
    if (!userSnapshot.exists) {
      throw new HttpException(
        `No se encontró el usuario con ID ${userId}`,
        HttpStatus.NOT_FOUND,
      );
    }
  
    const abogado = userSnapshot.data();
    if (!abogado || !abogado.fullName) {
      throw new HttpException(
        'El abogado no tiene un nombre completo registrado',
        HttpStatus.NOT_FOUND,
      );
    }
  
    // Usar el método común para actualizar estado y fecha
    await this.updateStateAndDate(consultaRef, 'asignado');
  
    // Actualizamos el responsable del caso
    await consultaRef.update({
      abogadoId: userId,
      responsableCaso: abogado.fullName,
      fechaAsignacion: Timestamp.now(),
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
