import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Obtiene los permisos de un rol específico desde Firestore
  async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      const roleDoc = await this.firebaseService.getDocuments('roles', 'role', role);
      
      if (roleDoc.length === 0) {
        throw new Error(`No se encontró el rol: ${role}`);
      }
      
      // Asumiendo que el documento contiene un array de permisos
      const permissions = roleDoc[0].permisos || [];
      return permissions;
    } catch (error) {
      console.error('Error al obtener permisos para el rol:', error);
      throw new Error(`No se pudieron obtener los permisos para el rol: ${role}`);
    }
  }

  // Actualiza los permisos de un rol específico
  async updatePermissionsForRole(role: string, permissions: string[]): Promise<string[]> {
    try {
      // Aquí accedes a Firestore para actualizar los permisos del rol
      await this.firebaseService.updateDocument('roles', role, { permisos: permissions });
      return permissions;
    } catch (error) {
      console.error('Error al actualizar permisos para el rol:', error);
      throw new Error(`No se pudieron actualizar los permisos para el rol: ${role}`);
    }
  }
}
