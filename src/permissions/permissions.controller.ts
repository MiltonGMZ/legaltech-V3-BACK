import { Controller, Get, Put, Body, Param, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Permissions') 
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get(':role')
  @ApiOperation({ summary: 'Obtener permisos de un rol específico' })
  @ApiParam({ name: 'role', description: 'El rol para obtener los permisos' })
  @ApiResponse({ status: 200, description: 'Permisos obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getPermissions(@Param('role') role: string) {
    try {
      const permissions = await this.permissionsService.getPermissionsForRole(role);
      return { role, permissions };
    } catch (error) {
      throw new NotFoundException(`No se encontraron permisos para el rol: ${role}`);
    }
  }

  @Put(':role')
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
      throw new NotFoundException(`No se pudo actualizar los permisos para el rol: ${role}`);
    }
  }
}
