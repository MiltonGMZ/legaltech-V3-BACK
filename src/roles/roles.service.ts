import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getAllRoles() {
    const snapshot = await this.firebaseService
      .getFirestore()
      .collection('roles')
      .get();
    
    // Mapeamos los documentos obtenidos y los retornamos
    return snapshot.docs.map((doc) => ({
      id: doc.id,  // id del documento (lo usas para identificar cada rol)
      permisos: doc.data().permisos || []  // Obtenemos los permisos asociados al rol
    }));
  }


  async getRoleById(roleId: string) {
    const doc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();
    
    if (!doc.exists) {
      throw new NotFoundException('Rol no encontrado');
    }
  
    return { id: doc.id, permisos: doc.data().permisos || [] };
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
