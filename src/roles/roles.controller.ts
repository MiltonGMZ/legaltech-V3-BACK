import { Controller, Get, Param, Put, Body, NotFoundException } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PermissionsService } from 'src/permissions/permissions.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get(':role/permissions')
  @ApiOperation({ summary: 'Obtener permisos de un rol específico' })
  @ApiParam({ name: 'role', description: 'El rol del cual se obtendrán los permisos' })
  @ApiResponse({ status: 200, description: 'Permisos obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getPermissions(@Param('role') role: string) {
    try {
      const permissions = await this.permissionsService.getPermissionsForRole(role);
      return { role, permissions };
    } catch (error) {
      throw new NotFoundException(`Error al obtener permisos: ${error.message}`);
    }
  }

  @Put(':role/permissions')
  @ApiOperation({ summary: 'Actualizar permisos de un rol específico' })
  @ApiParam({ name: 'role', description: 'El rol al cual se actualizarán los permisos' })
  @ApiResponse({ status: 200, description: 'Permisos actualizados correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async updatePermissions(
    @Param('role') role: string,
    @Body() permissions: string[],
  ) {
    try {
      const updatedPermissions = await this.permissionsService.updatePermissionsForRole(role, permissions);
      return { role, updatedPermissions };
    } catch (error) {
      throw new NotFoundException(`Error al actualizar permisos: ${error.message}`);
    }
  }
}
