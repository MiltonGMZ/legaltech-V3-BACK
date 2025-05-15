import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ConsultasService } from './consultas.service';
import { CreatePreConsultaDto, EstadoConsulta } from 'src/common/dtos/create-pre-consulta.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateComentarioDto } from 'src/common/dtos/create-comentario.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('Consultas Jurídicas')
@Controller('consultas')
export class ConsultasController {
  constructor(
    private readonly consultasService: ConsultasService,
    private readonly firebaseService: FirebaseService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva preconsulta jurídica' })
  @ApiBody({ type: CreatePreConsultaDto })
  @ApiResponse({ status: 201, description: 'Consulta creada correctamente' })
  async create(@Body() createPreConsultaDto: CreatePreConsultaDto) {
    try {
      return await this.consultasService.saveConsulta(createPreConsultaDto);
    } catch (error) {
      throw new HttpException(`Error al crear consulta: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las consultas registradas' })
  @ApiResponse({ status: 200, description: 'Consultas obtenidas correctamente' })
  async findAll() {
    try {
      return await this.consultasService.getAllConsultas();
    } catch (error) {
      throw new HttpException(`Error al obtener consultas: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('pendientes')
  @ApiOperation({ summary: 'Obtener solo las consultas pendientes' })
  @ApiResponse({ status: 200, description: 'Consultas pendientes obtenidas correctamente' })
  async findPending() {
    try {
      return await this.consultasService.getPendingConsultations();
    } catch (error) {
      throw new HttpException(`Error al obtener consultas pendientes: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('activos/:uid')
  @ApiOperation({ summary: 'Obtener los casos activos de un usuario' })
  @ApiResponse({ status: 200, description: 'Casos activos obtenidos correctamente' })
  async findActiveCases(@Param('uid') uid: string) {
    try {
      return await this.consultasService.getActiveCases(uid);
    } catch (error) {
      throw new HttpException(`Error al obtener casos activos: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado de una consulta' })
  @ApiBody({ schema: { example: { status: 'aprobado' } } })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente' })
  async updateStatus(@Param('id') id: string, @Body('status') status: EstadoConsulta) {
    try {
      return await this.consultasService.updateConsultaStatus(id, status);
    } catch (error) {
      throw new HttpException(`Error al actualizar el estado: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/asignar')
  @ApiOperation({ summary: 'Asignar un abogado a un caso' })
  @ApiBody({ schema: { example: { userId: 'UID_ABOGADO' } } })
  @ApiResponse({ status: 200, description: 'Caso asignado correctamente' })
  async assignCase(@Param('id') id: string, @Body('userId') userId: string) {
    try {
      return await this.consultasService.assignCase(id, userId);
    } catch (error) {
      throw new HttpException(`Error al asignar caso: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/rechazar')
  @ApiOperation({ summary: 'Rechazar un caso' })
  @ApiResponse({ status: 200, description: 'Caso rechazado correctamente' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  async rejectCase(@Param('id') id: string) {
    try {
      return await this.consultasService.rejectCase(id);
    } catch (error) {
      throw new HttpException(
        `Error al rechazar el caso: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id/estado-aprobado')
  @ApiOperation({ summary: 'Actualizar estado de un caso a aprobado' })
  @ApiParam({ name: 'id', description: 'ID del caso a aprobar' })
  @ApiResponse({ status: 200, description: 'Caso aprobado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al aprobar el caso' })
  async approveCase(@Param('id') consultaId: string, @Body() body: { status: string }) {
    if (body.status !== 'aprobado') {
      throw new HttpException('El estado debe ser "aprobado"', HttpStatus.BAD_REQUEST);
    }
    return await this.consultasService.updateConsultaStatus(consultaId, body.status as EstadoConsulta);
  }

  @Patch(':id/notificado')
  @ApiOperation({ summary: 'Marcar un caso como notificado' })
  @ApiParam({ name: 'id', description: 'ID del caso a notificar' })
  @ApiResponse({ status: 200, description: 'Caso notificado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al marcar el caso como notificado' })
  async markAsNotified(@Param('id') consultaId: string) {
    return await this.consultasService.updateConsultaStatus(consultaId, EstadoConsulta.NOTIFICADO);
  }

  @Post(':consultaId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir evidencia al caso' })
  @ApiResponse({ status: 201, description: 'Evidencia subida correctamente' })
  async uploadEvidence(
    @Param('consultaId') consultaId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const result = await this.firebaseService.uploadEvidence(file, consultaId);
      return { message: result.message, fileUrl: result.fileUrl };
    } catch (error) {
      throw new HttpException('Error al subir la evidencia: ' + error.message, HttpStatus.BAD_REQUEST);
    }
  }

 @Patch(':consultaId/activar')
@ApiOperation({ summary: 'Activar un caso asignado' })
@ApiResponse({ status: 200, description: 'Caso activado correctamente' })
@ApiResponse({ status: 403, description: 'No autorizado' })
@ApiResponse({ status: 400, description: 'Estado inválido' })
async activateCase(
  @Param('consultaId') consultaId: string,
  @Body('abogadoId') abogadoId: string,
) {
  if (!abogadoId) {
    throw new HttpException('El ID del abogado es requerido', HttpStatus.BAD_REQUEST);
  }
  return this.consultasService.activateCase(consultaId, abogadoId);
}


  @Get('asignados/:abogadoId')
  @ApiOperation({ summary: 'Obtener los casos asignados a un abogado' })
  @ApiResponse({ status: 200, description: 'Casos asignados obtenidos correctamente' })
  async getAssignedCases(@Param('abogadoId') abogadoId: string) {
    return this.consultasService.getAssignedCases(abogadoId);
  }

   @Patch(':id/comentarios')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiOperation({ summary: 'Agregar comentario con evidencia a un caso' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID del caso' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        texto: { type: 'string' },
        autorId: { type: 'string' },
        rol: { type: 'string', enum: ['usuario', 'abogado'] },
        archivo: {
          type: 'string',
          format: 'binary',
          nullable: true,
        },
      },
      required: ['texto', 'autorId', 'rol'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async addComentario(
    @Param('id') id: string,
    @Body() comentarioDto: CreateComentarioDto,
    @UploadedFile() archivo?: Express.Multer.File,
    @Req() req?: any,
  ) {
    // Aquí puedes obtener usuario logueado de req.user para validaciones
    return this.consultasService.addComentarioWithEvidence(id, comentarioDto.texto, archivo, comentarioDto.autorId, comentarioDto.rol);
  }

  @Patch(':id/cerrar')
  @ApiOperation({ summary: 'Cerrar un caso' })
  @ApiParam({ name: 'id', description: 'ID del caso a cerrar' })
  @ApiResponse({ status: 200, description: 'Caso cerrado correctamente' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  @ApiResponse({ status: 400, description: 'El caso ya está cerrado' })
  async closeCase(@Param('id') id: string) {
    try {
      return await this.consultasService.closeCase(id);
    } catch (error) {
      if (error.status && error.status === HttpStatus.NOT_FOUND) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.status && error.status === HttpStatus.BAD_REQUEST) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Error al cerrar el caso', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
