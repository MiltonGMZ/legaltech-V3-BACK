import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class RolesService {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Método para actualizar un documento de usuario en Firestore
  async updateUser(userId: string, updateData: any) {
    const result = await this.firebaseService.updateDocument('users', userId, updateData);
    return result;
  }

  // Método para obtener un documento de usuario en Firestore
async getUser(userId: string) {
  
  const users = await this.firebaseService.getDocuments('users', 'uid', userId); 
  const user = users.find(u => u.id === userId);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  return user;
}

}
