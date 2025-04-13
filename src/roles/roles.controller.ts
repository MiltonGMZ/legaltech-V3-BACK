import { Controller, Get, Post, Delete, Put, Body, Param, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
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
      throw new NotFoundException(error.message);
    }
  }

  @Get(':role/permissions')
  @ApiOperation({ summary: 'Obtener permisos de un rol específico' })
  @ApiParam({ name: 'role', description: 'Nombre del rol para obtener permisos' })
  @ApiResponse({ status: 200, description: 'Permisos obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getRolePermissions(@Param('role') role: string) {
    try {
      const permissions = await this.rolesService.getRolePermissions(role);
      return { role, permissions };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Put(':role/permissions')
async updateRolePermissions(@Param('role') role: string, @Body() permissions: { permisos: string[] }) {
  try {
    
    await this.rolesService.updateRolePermissions(role, permissions.permisos);
    return { role, updatedPermissions: permissions.permisos };
  } catch (error) {
    throw new HttpException('Error al actualizar permisos', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

}
