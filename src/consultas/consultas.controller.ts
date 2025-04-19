import { Controller, Get, Post, Patch, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConsultasService } from './consultas.service';
import { CreatePreConsultaDto } from 'src/common/dtos/create-pre-consulta.dto';

@ApiTags('Consultas Jurídicas')
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

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
}
