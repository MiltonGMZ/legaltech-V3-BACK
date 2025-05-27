import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCitaDto } from 'src/common/dtos/cita.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class CalendarService {
  private firestore = admin.firestore();

  async crearCita(createCitaDto: CreateCitaDto) {
    const citasRef = this.firestore.collection('citas');
    try {
      const data = {
        ...createCitaDto,
        fechaHora: new Date(createCitaDto.fechaHora),
        creadaEn: new Date(),
      };
      const docRef = await citasRef.add(data);
      return { id: docRef.id, ...data };
    } catch (error) {
      throw new HttpException('Error al crear cita: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerCitasPorAbogado(abogadoId: string) {
    const citasRef = this.firestore.collection('citas');
    const snapshot = await citasRef.where('abogadoId', '==', abogadoId).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaHora: data.fechaHora.toDate ? data.fechaHora.toDate() : data.fechaHora,
        creadaEn: data.creadaEn.toDate ? data.creadaEn.toDate() : data.creadaEn,
      };
    });
  }

  async obtenerClienteIdPorConsulta(consultaId: string): Promise<string | null> {
    const consultasRef = this.firestore.collection('consultas').doc(consultaId);
    const doc = await consultasRef.get();
    if (!doc.exists) return null;
    const data = doc.data();
    return data?.clienteId || null;
  }

  async obtenerCitasPorConsulta(consultaId: string) {
    const citasRef = this.firestore.collection('citas');
    const snapshot = await citasRef.where('consultaId', '==', consultaId).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaHora: data.fechaHora.toDate ? data.fechaHora.toDate() : data.fechaHora,
        creadaEn: data.creadaEn.toDate ? data.creadaEn.toDate() : data.creadaEn,
      };
    });
  }
}
