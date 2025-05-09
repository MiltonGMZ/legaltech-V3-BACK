import { Controller, Get, Post, Delete, Put, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { RolesService, RoleData } from './roles.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({ status: 200, description: 'Roles obtenidos correctamente' })
  async getAllRoles() {
    try {
      return await this.rolesService.getAllRoles();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al crear rol' })
  async createRole(@Body() roleData: RoleData) {
    try {
      return await this.rolesService.createRole(roleData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':role')
  @ApiOperation({ summary: 'Eliminar un rol por ID' })
  @ApiParam({ name: 'role', description: 'ID del rol a eliminar' })
  @ApiResponse({ status: 200, description: 'Rol eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async deleteRole(@Param('role') role: string) {
    try {
      await this.rolesService.deleteRole(role);
      return { message: 'Rol eliminado correctamente' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
  @Get(':role/permissions')
  @ApiOperation({ summary: 'Obtener permisos de un rol específico' })
  @ApiParam({ name: 'role', description: 'ID del rol para obtener los permisos' })
  @ApiResponse({ status: 200, description: 'Permisos obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getRolePermissions(@Param('role') role: string) {
    try {
      const permissions = await this.rolesService.getRolePermissions(role);
      if (!permissions || permissions.length === 0) {
        throw new HttpException(`No se encontraron permisos para el rol con ID ${role}`, HttpStatus.NOT_FOUND);
      }
      return { id: role, permisos: permissions };
    } catch (error) {
      throw new HttpException(`Error al obtener permisos para el rol ${role}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  // Endpoint para obtener los permisos asignados de un rol
  @Get(':role/permissions/assigned')
  @ApiOperation({ summary: 'Obtener los permisos asignados a un rol' })
  @ApiParam({ name: 'role', description: 'ID del rol para obtener permisos asignados' })
  @ApiResponse({ status: 200, description: 'Permisos asignados obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getAssignedPermissions(@Param('role') role: string) {
    try {
      const permissions = await this.rolesService.getAssignedPermissions(role);
      return { id: role, permisos: permissions };
    } catch (error) {
      throw new HttpException(`Error al obtener permisos asignados para el rol ${role}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint para obtener los permisos disponibles de un rol
  @Get(':role/permissions/available')
  @ApiOperation({ summary: 'Obtener los permisos disponibles para un rol' })
  @ApiParam({ name: 'role', description: 'ID del rol para obtener permisos disponibles' })
  @ApiResponse({ status: 200, description: 'Permisos disponibles obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getAvailablePermissions(@Param('role') role: string) {
    try {
      const permissions = await this.rolesService.getAvailablePermissions(role);
      return { id: role, permisosDisponibles: permissions };
    } catch (error) {
      throw new HttpException(`Error al obtener permisos disponibles para el rol ${role}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':role/permissions')
  @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  @ApiParam({ name: 'role', description: 'Nombre del rol para actualizar permisos' })
  @ApiResponse({ status: 200, description: 'Permisos actualizados correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async updateRolePermissions(@Param('role') role: string, @Body() permissions: { permisos: string[] }) {
    try {
      await this.rolesService.updateRolePermissions(role, permissions.permisos);
      return { role, updatedPermissions: permissions.permisos };
    } catch (error) {
      throw new HttpException('Error al actualizar permisos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

   
   @Get('permissions')
   @ApiOperation({ summary: 'Obtener todos los permisos disponibles' })
   @ApiResponse({ status: 200, description: 'Permisos obtenidos correctamente' })
   async getAllPermissions() {
     try {
       const permissions = await this.rolesService.getAllPermissions();
       return { permissions };
     } catch (error) {
       throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
     }
   }

   @Put(':role/assign-permissions')
  @ApiOperation({ summary: 'Asignar permisos a un rol' })
  @ApiParam({ name: 'role', description: 'ID del rol al que se asignarán los permisos' })
  @ApiResponse({ status: 200, description: 'Permisos asignados correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async assignPermissionsToRole(
    @Param('role') role: string,
    @Body() permissions: { permisos: string[] }
  ) {
    try {
      await this.rolesService.assignPermissionsToRole(role, permissions.permisos);
      return { message: `Permisos asignados al rol ${role} correctamente`, permisos: permissions.permisos };
    } catch (error) {
      throw new HttpException(`Error al asignar permisos al rol ${role}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
