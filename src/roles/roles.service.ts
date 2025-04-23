import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

export interface RoleData {
  id: string;
  permisos: string[];
}

@Injectable()
export class RolesService {
  constructor(
    private readonly firebaseService: FirebaseService,
  ) {}


  // Obtener todos los permisos disponibles desde Firestore
  async getAllPermissions(): Promise<string[]> {
    try {
      const snapshot = await this.firebaseService.getFirestore()
        .collection('permissions')
        .get();

      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      throw new Error(`Error al obtener permisos: ${error.message}`);
    }
  }
  
   // Asignar permisos a un rol
   async assignPermissionsToRole(roleId: string, permissions: string[]): Promise<void> {
    const validPermissions = await this.getAllPermissions();

    // Verificar que todos los permisos existen en la colección 'permissions'
    const invalidPermissions = permissions.filter(permission => !validPermissions.includes(permission));
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Los siguientes permisos no son válidos: ${invalidPermissions.join(', ')}`);
    }

    // Asignar los permisos al rol
    try {
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .update({ permisos: permissions });
    } catch (error) {
      throw new Error(`Error al asignar permisos al rol ${roleId}: ${error.message}`);
    }
  }

  async validatePermissionsExist(permissions: string[]): Promise<boolean> {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('permissions')
      .where('id', 'in', permissions)
      .get();
    
    return snapshot.docs.length === permissions.length;
  }

  // Obtener todos los roles desde Firestore
  async getAllRoles(): Promise<RoleData[]> {
    try {
      const snapshot = await this.firebaseService
        .getFirestore()
        .collection('roles')
        .get();
      
      if (snapshot.empty) {
        throw new NotFoundException('No se encontraron roles');
      }

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const permisos = data.permisos ? this.parsePermissions(data.permisos) : [];
        return {
          id: doc.id,
          permisos
        };
      });
    } catch (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }
  }

 

  // Obtener un rol por su ID// Obtener un rol por su ID
async getRoleById(roleId: string): Promise<RoleData> {
  try {
    const doc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();

    if (!doc.exists) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    const data = doc.data();
    const permisos = data?.permisos ? await this.getPermissionsDetails(data?.permisos) : [];
    
    return { id: doc.id, permisos };
  } catch (error) {
    throw new Error(`Error al obtener rol por ID: ${error.message}`);
  }
}


// Obtener los permisos asociados a un rol
// Obtener los permisos asociados a un rol
async getRolePermissions(roleId: string): Promise<any[]> {
  try {
    const roleDoc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();

    if (!roleDoc.exists) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    const permisos = roleDoc.data()?.permisos || [];
    if (permisos.length === 0) {
      throw new NotFoundException(`No se encontraron permisos para el rol con ID ${roleId}`);
    }

    // Obtener los detalles de los permisos (nombre, descripción)
    const permisosDetalles = await this.getPermissionsDetails(permisos);

    return permisosDetalles; // Devolver permisos con detalles (nombre y descripción)
  } catch (error) {
    throw new Error(`Error al obtener permisos del rol ${roleId}: ${error.message}`);
  }
}

// Método para obtener los detalles de los permisos (nombre, descripción)
async getPermissionsDetails(permissionIds: string[]): Promise<any[]> {
  const permissions = [];
  try {
    for (const permissionId of permissionIds) {
      const permissionDoc = await this.firebaseService.getFirestore()
        .collection('permissions')
        .doc(permissionId)
        .get();

      if (permissionDoc.exists) {
        const permissionData = permissionDoc.data();
        permissions.push({
          id: permissionId,
          nombre: permissionData?.nombre,       // Suponiendo que 'nombre' es un campo en la colección 'permissions'
          descripcion: permissionData?.descripcion // Suponiendo que 'descripcion' es un campo en la colección 'permissions'
        });
      }
    }
    return permissions;
  } catch (error) {
    throw new Error(`Error al obtener detalles de los permisos: ${error.message}`);
  }
}




  // Crear un nuevo rol
  async createRole(roleData: RoleData): Promise<{ message: string, id: string }> {
    try {
      if (!roleData.id || roleData.permisos.length === 0) {
        throw new BadRequestException('El rol debe tener un ID y al menos un permiso');
      }

      const newRole = await this.firebaseService.addDocument('roles', {
        id: roleData.id,
        permisos: roleData.permisos,
      });

      return { message: 'Rol creado exitosamente', id: newRole.docId };
    } catch (error) {
      throw new Error(`Error al crear rol: ${error.message}`);
    }
  }

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

  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    try {
      // Actualizar permisos del rol en la colección de roles
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .update({ permisos: permissions });
  
      // Ahora, actualizamos los permisos de todos los usuarios que tienen este rol
      const usersSnapshot = await this.firebaseService.getFirestore()
        .collection('users')
        .where('role', '==', roleId) // Filtrar usuarios con este rol
        .get();
  
      usersSnapshot.forEach(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Actualizar los permisos del usuario
        await this.firebaseService.getFirestore()
          .collection('users')
          .doc(userId)
          .update({ permissions: permissions });  // Actualiza los permisos para este usuario
      });
  
    } catch (error) {
      throw new Error(`Error al actualizar permisos del rol: ${error.message}`);
    }
  }
  

  // Método privado para parsear permisos (si es necesario)
  private parsePermissions(permisos: string | string[]): string[] {
    if (typeof permisos === 'string') {
      try {
        return JSON.parse(permisos); 
      } catch (error) {
        throw new BadRequestException('Formato de permisos inválido');
      }
    }
    return permisos || [];
  }
}
