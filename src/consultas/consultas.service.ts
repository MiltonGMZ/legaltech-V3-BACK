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


private async updateStateAndDate(
  consultaRef: FirebaseFirestore.DocumentReference,
  estado: string,
  tipo?: string
) {
  const currentTimestamp = admin.firestore.Timestamp.now();

  const updateData: { estado: string; fechaActualizacion: FirebaseFirestore.Timestamp; tipo?: string } = {
    estado,
    fechaActualizacion: currentTimestamp,
  };

  if (tipo) {
    updateData.tipo = tipo;
  }

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
  console.log('Buscando consulta con ID:', consultaId);

  const consultaRef = this.firestore.collection('consultas').doc(consultaId);
  const consultaSnapshot = await consultaRef.get();

  console.log('Existe:', consultaSnapshot.exists);

  if (!consultaSnapshot.exists) {
    throw new HttpException('Consulta no encontrada', HttpStatus.NOT_FOUND);
  }

  const data = consultaSnapshot.data();

  return {
    id: consultaSnapshot.id,
    ...data,
    fechaCreacion: data?.fechaCreacion && typeof data.fechaCreacion.toDate === 'function'
      ? data.fechaCreacion.toDate()
      : null,
    fechaActualizacion: data?.fechaActualizacion && typeof data.fechaActualizacion.toDate === 'function'
      ? data.fechaActualizacion.toDate()
      : null,
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

    await this.updateStateAndDate(consultaRef, status);
  
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

  if (!consultaSnapshot.exists) {
    throw new HttpException(
      `No se encontró el caso con ID ${consultaId}`,
      HttpStatus.NOT_FOUND,
    );
  }

  const consultaData = consultaSnapshot.data();

  // Permitir reasignar solo si no hay abogado asignado o si es el mismo usuario
  if (consultaData.abogadoId && consultaData.abogadoId !== userId) {
    throw new HttpException(
      'Este caso ya tiene un abogado asignado',
      HttpStatus.CONFLICT,
    );
  }

  // Buscar usuario por el campo uid en lugar de usar doc(userId)
  const userQuerySnapshot = await this.firestore
    .collection('users')
    .where('uid', '==', userId)
    .get();

  if (userQuerySnapshot.empty) {
    throw new HttpException(
      `No se encontró el usuario con ID ${userId}`,
      HttpStatus.NOT_FOUND,
    );
  }

  const userDoc = userQuerySnapshot.docs[0];
  const abogado = userDoc.data();

  if (!abogado || !abogado.fullName) {
    throw new HttpException(
      'El abogado no tiene un nombre completo registrado',
      HttpStatus.NOT_FOUND,
    );
  }

  // Actualizar estado y datos del caso
  await consultaRef.update({
    estado: 'asignado',
    abogadoId: userId,
    responsableCaso: abogado.fullName,
    fechaAsignacion: admin.firestore.Timestamp.now(),
  });

  await this.updateStateAndDate(consultaRef, 'asignado');
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

  async activateCase(consultaId: string, abogadoId: string) {
  const consultaRef = this.firestore.collection('consultas').doc(consultaId);
  const consultaSnapshot = await consultaRef.get();

  if (!consultaSnapshot.exists) {
    throw new HttpException(
      `Consulta con ID ${consultaId} no encontrada`,
      HttpStatus.NOT_FOUND,
    );
  }

  const caseData = consultaSnapshot.data();

  // Verificar que el abogado que intenta activar sea el asignado
  if (caseData.abogadoId !== abogadoId) {
    throw new HttpException(
      'Solo el abogado asignado puede activar este caso',
      HttpStatus.FORBIDDEN,
    );
  }

  // Solo permitir activar si el caso está en estado 'asignado'
  if (caseData.estado !== 'asignado') {
    throw new HttpException(
      `El caso debe estar en estado 'asignado' para activarse, estado actual: ${caseData.estado}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  await consultaRef.update({
    estado: 'activo',
    fechaActualizacion: Timestamp.now(),
  });

  await this.updateStateAndDate(consultaRef, 'activo');

  return {
    status: 'success',
    message: `El caso #${consultaId} ha sido activado correctamente.`,
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
