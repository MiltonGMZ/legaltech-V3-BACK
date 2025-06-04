import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    // Filtramos los documentos en la colección 'users' donde el campo 'uid' coincida
    const snapshot = await this.firebaseService.getFirestore()
      .collection('users') // Seleccionamos la colección 'users'
      .where('uid', '==', uid) // Filtramos por el campo 'uid' que contiene el identificador del usuario
      .get();
  
    // Verificamos si la consulta devolvió algún documento
    if (snapshot.empty) {
      throw new HttpException(`Usuario con UID ${uid} no encontrado`, HttpStatus.NOT_FOUND);
    }
  
    // Devolvemos el primer documento que coincida (aunque debería ser solo uno)
    const user = snapshot.docs[0]; 
    return { uid: user.id, ...user.data() }; // Devolvemos el UID del documento y los datos del usuario
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

  async updateUsuarios(uids: string[], data: { [x: string]: any; }) {
    if (!data || Object.keys(data).length === 0) {
      throw new HttpException('No se proporcionaron datos para actualizar.', HttpStatus.BAD_REQUEST);
    }
  
    const batch = this.firebaseService.getFirestore().batch();
  
    // Transformar data para eliminar cualquier prototipo o clase
    const plainData = Object.assign({}, data);
  
    // Verificar que los usuarios existan antes de intentar actualizar
    for (const uid of uids) {
      // Buscamos el documento donde el campo 'uid' coincida
      const snapshot = await this.firebaseService.getFirestore()
        .collection('users')
        .where('uid', '==', uid)
        .get();
  
      if (snapshot.empty) {
        throw new HttpException(`Usuario con UID ${uid} no encontrado`, HttpStatus.NOT_FOUND);
      }
  
      const docRef = snapshot.docs[0].ref; // Obtenemos la referencia al documento
      batch.update(docRef, plainData); // Preparamos la actualización
    }
  
    try {
      await batch.commit();
      return { message: 'Usuarios actualizados correctamente' };
    } catch (error) {
      throw new HttpException(`Error al actualizar los usuarios: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
  
  

  async deleteUsuario(uid: string) {
  const firestore = this.firebaseService.getFirestore();
  const usersCollection = firestore.collection('users');

  // Buscar documentos donde el campo 'uid' sea igual al uid dado
  const querySnapshot = await usersCollection.where('uid', '==', uid).get();

  if (querySnapshot.empty) {
    throw new NotFoundException(`El usuario con UID ${uid} no existe`);
  }

  // Eliminar todos los documentos que coincidan (normalmente debería ser uno solo)
  const batch = firestore.batch();
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  return { message: 'Usuario eliminado correctamente' };
}



  // Obtener abogados
  async getAbogados() {
    const snapshot = await this.firebaseService
      .getFirestore()
      .collection('users')
      .where('role', '==', 'abogado') // Filtra los usuarios cuyo rol es 'abogado'
      .get();

    if (snapshot.empty) {
      throw new HttpException('No se encontraron abogados', HttpStatus.NOT_FOUND);
    }

    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  }
}