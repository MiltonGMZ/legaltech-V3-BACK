import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthService } from 'src/auth/auth.service';


export interface RoleData {
  id: string;
  permisos: string[];
}

@Injectable()
export class RolesService {
  constructor(
    private readonly firebaseService: FirebaseService,
  ) {}

  // Obtener todos los roles desde Firestore
  async getAllRoles(): Promise<RoleData[]> {
    try {
      const snapshot = await this.firebaseService
        .getFirestore()
        .collection('roles')
        .get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        permisos: doc.data().permisos || [] 
      }));
    } catch (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }
  }

  // Obtener un rol por su ID
  async getRoleById(roleId: string): Promise<RoleData> {
    try {
      const doc = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .get();

      if (!doc.exists) {
        throw new NotFoundException('Rol no encontrado');
      }
      
      return { id: doc.id, permisos: doc.data().permisos || [] };
    } catch (error) {
      throw new Error(`Error al obtener rol por ID: ${error.message}`);
    }
  }

  // Crear un nuevo rol
  async createRole(roleData: RoleData): Promise<{ message: string, id: string }> {
    try {
      // Validación básica
      if (!roleData.id || roleData.permisos.length === 0) {
        throw new Error('El rol debe tener un ID y al menos un permiso');
      }

      // Añadir el nuevo rol a la colección 'roles'
      const newRole = await this.firebaseService.addDocument('roles', {
        id: roleData.id,
        permisos: roleData.permisos,
      });

      return { message: 'Rol creado exitosamente', id: newRole.docId };
    } catch (error) {
      throw new Error(`Error al crear rol: ${error.message}`);
    }
  }

  // Eliminar un rol por su ID
  async deleteRole(roleId: string): Promise<{ message: string }> {
    try {
      const roleDoc = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .get();
        
      if (!roleDoc.exists) {
        throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
      }
  
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .delete();
  
      return { message: 'Rol eliminado correctamente' }; 
    } catch (error) {
      throw new Error(`Error al eliminar rol: ${error.message}`);
    }
  }

  // Obtener los permisos asociados a un rol
  async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const roleDoc = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .get();

      if (!roleDoc.exists) {
        throw new NotFoundException(`Rol ${roleId} no encontrado`);
      }
      
      return roleDoc.data()?.permisos || [];
    } catch (error) {
      throw new Error(`Error al obtener permisos del rol ${roleId}: ${error.message}`);
    }
  }

  // Actualizar los permisos de un rol
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<{ message: string, permisos: string[] }> {
    try {
      // Verificamos si el rol existe antes de intentar actualizarlo
      const roleDoc = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .get();

      if (!roleDoc.exists) {
        throw new NotFoundException(`Rol ${roleId} no encontrado`);
      }

      // Actualizamos los permisos
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .update({ permisos: permissions });

      // Retornamos los permisos actualizados
      return { message: `Permisos del rol ${roleId} actualizados correctamente`, permisos: permissions };
    } catch (error) {
      throw new Error(`Error al actualizar permisos del rol ${roleId}: ${error.message}`);
    }
  }
}
