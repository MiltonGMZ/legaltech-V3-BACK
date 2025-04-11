import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUsuarioDto } from './dtos/create-usuario.dto';
import { UpdateUsuarioDto } from './dtos/update-usuario.dto';


@Injectable()
export class UsuariosService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getAllUsuarios() {
    const snapshot = await this.firebaseService
      .getFirestore()
      .collection('users')
      .get();

    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  }

  async getUsuarioById(uid: string) {
    const doc = await this.firebaseService.getFirestore().collection('users').doc(uid).get();
    if (!doc.exists) throw new NotFoundException('Usuario no encontrado');
    return { uid: doc.id, ...doc.data() };
  }

  async createUsuario(data: CreateUsuarioDto) {
    const user = {
      ...data,
      createdAt: new Date(),
    };
    const docRef = await this.firebaseService
      .getFirestore()
      .collection('users')
      .add(user);
    return { uid: docRef.id, ...user };
  }

  async updateUsuario(uid: string, data: UpdateUsuarioDto) {
    const docRef = this.firebaseService.getFirestore().collection('users').doc(uid);
  
    // Eliminar propiedades undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  
    // Aplicar update solo con los campos definidos
    await docRef.update(cleanData);
    const updated = await docRef.get();
    return { uid: updated.id, ...updated.data() };
  }
  

  async deleteUsuario(uid: string) {
    await this.firebaseService.getFirestore().collection('users').doc(uid).delete();
    return { message: 'Usuario eliminado correctamente' };
  }
}
