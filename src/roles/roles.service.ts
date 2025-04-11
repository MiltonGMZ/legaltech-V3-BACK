import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PermissionsService } from '../permissions/permissions.service';


export interface RoleData {
  permisos: string[];  
}


@Injectable()
export class RolesService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // Obtener todos los roles desde Firestore
  async getAllRoles(): Promise<RoleData[]> {
    try {
      // Asumimos que 'roles' es la colección y que contiene un campo 'permisos'
      const roles = await this.firebaseService.getDocuments('roles', 'name', ''); 
      return roles.map(role => ({
        permisos: role.permisos || [], // Devuelve solo el array de permisos
      }));
    } catch (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }
  }

  // Crear un nuevo rol
  async createRole(roleData: RoleData): Promise<any> {
    try {
      // Crear un nuevo documento con el campo 'permisos'
      const newRole = await this.firebaseService.addDocument('roles', {
        permisos: roleData.permisos,
      });
      return newRole;
    } catch (error) {
      throw new Error(`Error al crear rol: ${error.message}`);
    }
  }


  // Eliminar un rol por su id
  async deleteRole(role: string): Promise<void> {
    try {
      const roleDoc = await this.firebaseService.getDocuments('roles', 'id', role);
      if (roleDoc.length === 0) {
        throw new Error(`Rol con id ${role} no encontrado`);
      }

      // Eliminar el rol desde Firestore
      await this.firebaseService.deleteDocument('roles', role);
    } catch (error) {
      throw new Error(`Error al eliminar rol: ${error.message}`);
    }
  }

  // Obtener los permisos asociados a un rol
  async getRolePermissions(role: string): Promise<string[]> {
    try {
      // Obtener permisos del rol desde Firestore
      const roleDoc = await this.firebaseService.getDocuments('roles', 'role', role);
      if (roleDoc.length === 0) {
        throw new Error(`Rol ${role} no encontrado`);
      }
      return roleDoc[0].permisos || [];
    } catch (error) {
      throw new Error(`Error al obtener permisos del rol ${role}: ${error.message}`);
    }
  }
  // Actualizar los permisos de un rol
  async updateRolePermissions(role: string, permissions: string[]): Promise<string[]> {
    try {
      const updatedPermissions = await this.permissionsService.updatePermissionsForRole(role, permissions);
      return updatedPermissions;
    } catch (error) {
      throw new Error(`Error al actualizar permisos del rol ${role}: ${error.message}`);
    }
  }
}
