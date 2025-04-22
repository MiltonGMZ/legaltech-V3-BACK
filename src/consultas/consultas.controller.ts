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
import { CreatePreConsultaDto } from 'src/common/dtos/create-pre-consulta.dto';
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
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
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
      throw new Error('El estado debe ser "aprobado"');
    }
    return await this.consultasService.updateConsultaStatus(casoId, body.status);
  }

  // Endpoint para marcar un caso como notificado
  @Patch(':id/notificado')
  @ApiOperation({ summary: 'Marcar un caso como notificado' })
  @ApiParam({ name: 'id', description: 'ID del caso a notificar' })
  @ApiResponse({ status: 200, description: 'Caso notificado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al marcar el caso como notificado' })
  async markAsNotified(@Param('id') casoId: string) {
    return await this.consultasService.updateConsultaStatus(casoId, 'notificado');
  }

  @Post(':consultaId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('consultaId') consultaId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const result = await this.firebaseService.uploadEvidence(file, consultaId);
      return { message: result.message, fileUrl: result.fileUrl };
    } catch (error) {
      throw new Error('Error al subir la evidencia: ' + error.message);
    }
  }

  @ApiOperation({ summary: 'Activar los casos asignados' })
@ApiResponse({ status: 200, description: 'Activar casos asignados obtenidos correctamente' })
@Patch(':consultaId/activar')
async activateCase(@Param('consultaId') consultaId: string) {
  return this.consultasService.activateCase(consultaId);
}


// ConsultasController (Backend)
@Get('asignados/:abogadoId')
@ApiOperation({ summary: 'Obtener los casos asignados a un abogado' })
@ApiResponse({ status: 200, description: 'Casos asignados obtenidos correctamente' })
async getAssignedCases(@Param('abogadoId') abogadoId: string) {
  return this.consultasService.getAssignedCases(abogadoId);
}
}
