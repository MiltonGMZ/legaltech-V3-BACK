import { Controller, Get, Post, Param, Body, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dtos/create-usuario.dto';
import { UpdateUsuarioDto } from './dtos/update-usuario.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida correctamente' })
  getAllUsuarios() {
    return this.usuariosService.getAllUsuarios();
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Obtener usuario por UID' })
  @ApiParam({ name: 'uid', description: 'UID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getUsuarioById(@Param('uid') uid: string) {
    return this.usuariosService.getUsuarioById(uid);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  createUsuario(@Body() body: CreateUsuarioDto) {
    return this.usuariosService.createUsuario(body);
  }

  @Put(':uid')
@ApiOperation({ summary: 'Actualizar usuario existente' })
@ApiParam({ name: 'uid', description: 'UID del usuario a actualizar' })
@ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
updateUsuario(@Param('uid') uid: string, @Body() body: UpdateUsuarioDto) {
  return this.usuariosService.updateUsuarios([uid], body);
}

  @Delete(':uid')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'uid', description: 'UID del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  deleteUsuario(@Param('uid') uid: string) {
    return this.usuariosService.deleteUsuario(uid);
  }

  @Get('abogados')
@ApiOperation({ summary: 'Obtener todos los abogados' })
@ApiResponse({ status: 200, description: 'Abogados obtenidos correctamente' })
@ApiResponse({ status: 404, description: 'No se encontraron abogados' })
async getAbogados() {
  try {
    return await this.usuariosService.getAbogados();
  } catch (error) {
    throw new HttpException('No se encontraron abogados', HttpStatus.NOT_FOUND);
  }
}



}
