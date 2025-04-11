import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsService {
  private readonly rolePermissions = {
    administrador: [
      "crear_usuarios",
      "editar_usuarios",
      "eliminar_usuarios",
      "ver_usuarios",
      "acceso_dashboard",
      "asignar_casos",
      "ver_casos",
      "ver_mis_casos",
      "actualizar_casos",
      "crear_casos",
      "actualizar_perfil",
      "finalizar_casos",
      "crear_usuario",
      "editar_usuario",
      "eliminar_usuario",
      "crear_preconsulta"
    ],
    abogado: [
      "ver_usuarios",
      "ver_casos",
      "ver_mis_casos",
      "crear_casos",
      "actualizar_casos",
      "actualizar_perfil",
      "finalizar_casos",
      "crear_preconsulta",
      "crear_usuario",
      "editar_usuario"
    ],
    coordinador: [
      "asignar_casos",
      "ver_casos",
      "ver_mis_casos",
      "actualizar_casos",
      "crear_casos",
      "actualizar_perfil",
      "finalizar_casos",
      "crear_usuario",
      "editar_usuario",
      "eliminar_usuario"
    ],
    usuario: [
      "ver_casos",
      "ver_mis_casos",
      "actualizar_perfil"
    ],
    aprendiz: [
      "ver_casos",
      "ver_mis_casos"
    ]
  };

  // Obtiene los permisos de un rol específico
  async getPermissionsForRole(role: string): Promise<string[]> {
    const permissions = this.rolePermissions[role];
    if (!permissions) {
      throw new Error(`No se encontraron permisos para el rol: ${role}`);
    }
    return permissions;
  }

  // Actualiza los permisos de un rol
  async updatePermissionsForRole(role: string, permissions: string[]): Promise<string[]> {
    if (!this.rolePermissions[role]) {
      throw new Error(`No se encontró el rol: ${role}`);
    }

    this.rolePermissions[role] = permissions;
    return this.rolePermissions[role];
  }
}
