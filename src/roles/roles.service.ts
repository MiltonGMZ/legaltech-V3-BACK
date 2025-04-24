import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

export interface RoleData {
  id: string;
  permisos: string[];
}

@Injectable()
export class RolesService {
  private readonly adminRoleId = 'administrador';
  constructor(
    private readonly firebaseService: FirebaseService,
  ) {}


  // Obtener todos los permisos disponibles desde el rol de administrador
  async getAllPermissions(): Promise<string[]> {
    try {
      const snapshot = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(this.adminRoleId)
        .get();

        if (!snapshot.exists) {
          throw new NotFoundException('Rol de administrador no encontrado');
        }
  
        const data = snapshot.data();
        return data?.permisos || [];
      } catch (error) {
        throw new Error(`Error al obtener permisos: ${error.message}`);
      }
    }

  // Obtener todos los roles desde Firestore
  async getAllRoles(): Promise<RoleData[]> {
    try {
      const snapshot = await this.firebaseService
        .getFirestore()
        .collection('roles')
        .get();
      
      if (snapshot.empty) {
        throw new NotFoundException('No roles found');
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

  // Obtener un rol por su ID
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
      const permisos = this.parsePermissions(data?.permisos);
      
      return { id: doc.id, permisos };
    } catch (error) {
      throw new Error(`Error al obtener rol por ID: ${error.message}`);
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
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    return roleDoc.data()?.permisos || [];
  } catch (error) {
    throw new Error(`Error al obtener permisos del rol ${roleId}: ${error.message}`);
  }
}


async getAssignedPermissions(roleId: string): Promise<string[]> {
  try {
    const roleDoc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();

    if (!roleDoc.exists) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    // Retorna solo los permisos ya asignados
    return roleDoc.data()?.permisos || [];
  } catch (error) {
    throw new Error(`Error al obtener permisos asignados del rol ${roleId}: ${error.message}`);
  }
}

// En el servicio de Roles (RolesService)
async getAvailablePermissions(roleId: string): Promise<string[]> {
  try {
    const roleDoc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();

    if (!roleDoc.exists) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    const assignedPermissions = roleDoc.data()?.permisos || [];
    const allPermissions = await this.getAllPermissions();  // Obtenemos todos los permisos disponibles
    const availablePermissions = allPermissions.filter((perm) => !assignedPermissions.includes(perm));

    return availablePermissions;
  } catch (error) {
    throw new Error(`Error al obtener permisos disponibles para el rol ${roleId}: ${error.message}`);
  }
}



// Crear un nuevo rol
async createRole(roleData: RoleData): Promise<{ message: string, id: string }> {
  try {
    // Validar que el rol tiene un ID y al menos un permiso
    if (!roleData.id || roleData.permisos.length === 0) {
      throw new BadRequestException('El rol debe tener un ID y al menos un permiso');
    }

    // Utilizar el ID proporcionado para crear el documento en Firestore
    const roleRef = this.firebaseService.getFirestore().collection('roles').doc(roleData.id);

    // Establecer los datos del documento en Firestore
    await roleRef.set({
      permisos: roleData.permisos,  // Asignar los permisos al rol
    });

    // Retornar la respuesta con el mensaje y el ID del rol
    return { message: 'Rol creado exitosamente', id: roleData.id };
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

  
// Asignar permisos a un rol
async assignPermissionsToRole(roleId: string, permissions: string[]): Promise<void> {
  
  const validPermissions = await this.getAllPermissions();

  // Verificar que todos los permisos existen en la colección de permisos
  const invalidPermissions = permissions.filter(permission => !validPermissions.includes(permission));
  if (invalidPermissions.length > 0) {
    throw new BadRequestException(`Los siguientes permisos no son válidos: ${invalidPermissions.join(', ')}`);
  }

  // Prevenir que se quiten los permisos del administrador
  if (roleId === this.adminRoleId) {
    throw new BadRequestException('No se pueden modificar los permisos del administrador');
  }

  try {
    await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .update({ permisos: permissions });
  } catch (error) {
    throw new Error(`Error al asignar permisos al rol ${roleId}: ${error.message}`);
  }
}


  // Actualizar los permisos de un rol
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<{ message: string, permisos: string[] }> {
    try {
      const roleDoc = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .get();

      if (!roleDoc.exists) {
        throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
      }

      // Verificamos y parseamos los permisos antes de actualizar
      const parsedPermissions = this.parsePermissions(permissions);
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .update({ permisos: parsedPermissions });

      return { message: `Permisos del rol con ID ${roleId} actualizados correctamente`, permisos: parsedPermissions };
    } catch (error) {
      throw new Error(`Error al actualizar permisos del rol con ID ${roleId}: ${error.message}`);
    }
  }

  
  private parsePermissions(permisos: string | string[]): string[] {
    if (typeof permisos === 'string') {
      try {
        return JSON.parse(permisos);  // Si los permisos son una cadena JSON, parsearla
      } catch (error) {
        throw new BadRequestException('Formato de permisos inválido');
      }
    }
    return permisos || [];
  }
}
