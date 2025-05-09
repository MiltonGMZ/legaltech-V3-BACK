import { Injectable, HttpException, BadRequestException, HttpStatus } from '@nestjs/common';
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
          throw new HttpException('Rol de administrador no encontrado', HttpStatus.NOT_FOUND);
        }
  
        const data = snapshot.data();
        return data?.permisos || [];
      } catch (error) {
        throw new HttpException(`Error al obtener permisos: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
        throw new HttpException('No se encontraron roles', HttpStatus.NOT_FOUND);
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
      throw new HttpException(`Error al obtener roles: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
        throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const data = doc.data();
      const permisos = this.parsePermissions(data?.permisos);
      
      return { id: doc.id, permisos };
    } catch (error) {
      throw new HttpException(`Error al obtener rol por ID: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
    }

    return roleDoc.data()?.permisos || [];
  } catch (error) {
    throw new HttpException(`Error al obtener permisos del rol ${roleId}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


async getAssignedPermissions(roleId: string): Promise<string[]> {
  try {
    const roleDoc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();

    if (!roleDoc.exists) {
      throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
    }

    // Retorna solo los permisos ya asignados
    return roleDoc.data()?.permisos || [];
  } catch (error) {
    throw new HttpException(`Error al obtener permisos asignados del rol ${roleId}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
    }

    const assignedPermissions = roleDoc.data()?.permisos || [];
    const allPermissions = await this.getAllPermissions();  // Obtenemos todos los permisos disponibles
    const availablePermissions = allPermissions.filter((perm) => !assignedPermissions.includes(perm));

    return availablePermissions;
  } catch (error) {
    throw new HttpException(`Error al obtener permisos disponibles para el rol ${roleId}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}



async createRole(roleData: RoleData): Promise<{ message: string, id: string }> {
  try {
    if (!roleData.id) {
      throw new BadRequestException('El rol debe tener un ID');
    }

    
    if (!roleData.permisos || roleData.permisos.length === 0) {
      const defaultPermissions = await this.getDefaultPermissionsForRole('usuario'); 
      roleData.permisos = defaultPermissions;
    }

    // Añadir el nuevo rol a la colección 'roles'
    const newRole = await this.firebaseService.addDocument('roles', {
      id: roleData.id,
      permisos: roleData.permisos,
    });

    return { message: 'Rol creado exitosamente', id: newRole.docId };
  } catch (error) {
    throw new HttpException(`Error al crear rol: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Método para obtener los permisos del rol 'usuario' como permisos por defecto
async getDefaultPermissionsForRole(roleId: string): Promise<string[]> {
  try {
    const roleDoc = await this.firebaseService.getFirestore()
      .collection('roles')
      .doc(roleId)
      .get();

    if (!roleDoc.exists) {
      throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
    }

    return roleDoc.data()?.permisos || [];
  } catch (error) {
    throw new HttpException(`Error al obtener permisos del rol ${roleId}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


  async deleteRole(roleId: string): Promise<{ message: string }> {
    try {
      const roleDoc = await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .get();
        
      if (!roleDoc.exists) {
        throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
      }
  
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .delete();
  
      return { message: 'Rol eliminado correctamente' }; 
    } catch (error) {
      throw new HttpException(`Error al eliminar rol: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
    throw new HttpException(`Error al asignar permisos al rol ${roleId}: ${error.message}`, HttpStatus.BAD_REQUEST);
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
        throw new HttpException(`Rol con ID ${roleId} no encontrado`, HttpStatus.NOT_FOUND);
      }

      // Verificamos y parseamos los permisos antes de actualizar
      const parsedPermissions = this.parsePermissions(permissions);
      await this.firebaseService.getFirestore()
        .collection('roles')
        .doc(roleId)
        .update({ permisos: parsedPermissions });

      return { message: `Permisos del rol con ID ${roleId} actualizados correctamente`, permisos: parsedPermissions };
    } catch (error) {
      throw new HttpException(`Error al actualizar permisos del rol con ID ${roleId}: ${error.message}`, HttpStatus.BAD_REQUEST);
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
