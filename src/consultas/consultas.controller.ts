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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ConsultasService } from './consultas.service';
import { CreatePreConsultaDto, EstadoConsulta } from 'src/common/dtos/create-pre-consulta.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from 'src/firebase/firebase.service';

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
  async approveCase(@Param('id') casoId: string, @Body() body: { status: string }) {
    if (body.status !== 'aprobado') {
      throw new HttpException('El estado debe ser "aprobado"', HttpStatus.BAD_REQUEST);
    }
    return await this.consultasService.updateConsultaStatus(casoId, body.status as EstadoConsulta);
  }

  @Patch(':id/notificado')
  @ApiOperation({ summary: 'Marcar un caso como notificado' })
  @ApiParam({ name: 'id', description: 'ID del caso a notificar' })
  @ApiResponse({ status: 200, description: 'Caso notificado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al marcar el caso como notificado' })
  async markAsNotified(@Param('id') casoId: string) {
    return await this.consultasService.updateConsultaStatus(casoId, EstadoConsulta.NOTIFICADO);
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
  @ApiOperation({ summary: 'Activar los casos asignados' })
  @ApiResponse({ status: 200, description: 'Activar casos asignados obtenidos correctamente' })
  async activateCase(@Param('consultaId') consultaId: string) {
    return this.consultasService.activateCase(consultaId);
  }

  @Get('asignados/:abogadoId')
  @ApiOperation({ summary: 'Obtener los casos asignados a un abogado' })
  @ApiResponse({ status: 200, description: 'Casos asignados obtenidos correctamente' })
  async getAssignedCases(@Param('abogadoId') abogadoId: string) {
    return this.consultasService.getAssignedCases(abogadoId);
  }

  @Patch(':id/comentarios')
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiOperation({ summary: 'Agregar comentario con evidencia al caso' })
  @ApiResponse({ status: 200, description: 'Comentario agregado correctamente' })
  async addComentario(
    @Param('id') id: string,
    @Body('comentario') comentario: string,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (!comentario && !archivo) {
      throw new HttpException('Debe enviar comentario o evidencia', HttpStatus.BAD_REQUEST);
    }
    return this.consultasService.addComentarioWithEvidence(id, comentario, archivo);
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
