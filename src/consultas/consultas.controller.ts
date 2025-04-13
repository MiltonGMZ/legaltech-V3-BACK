import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConsultasService } from './consultas.service';
import { CreatePreConsultaDto } from 'src/common/dtos/create-pre-consulta.dto';

@ApiTags('Consultas Jurídicas')
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  // Ruta para crear una nueva consulta
  @Post()
  @ApiOperation({ summary: 'Crear una nueva preconsulta jurídica' })
  @ApiBody({ type: CreatePreConsultaDto })
  @ApiResponse({ status: 201, description: 'Consulta creada correctamente' })
  async create(@Body() createPreConsultaDto: CreatePreConsultaDto) {
    try {
      return await this.consultasService.saveConsulta(createPreConsultaDto);
    } catch (error) {
      throw new HttpException(
        `Error al crear consulta: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Ruta para obtener todas las consultas
  @Get()
  @ApiOperation({ summary: 'Obtener todas las consultas registradas' })
  @ApiResponse({ status: 200, description: 'Consultas obtenidas correctamente' })
  async findAll() {
    try {
      return await this.consultasService.getAllConsultas();
    } catch (error) {
      throw new HttpException(
        `Error al obtener consultas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Ruta para obtener solo las consultas pendientes
  @Get('pendientes')
  @ApiOperation({ summary: 'Obtener solo las consultas pendientes' })
  @ApiResponse({ status: 200, description: 'Consultas pendientes obtenidas correctamente' })
  async findPending() {
    try {
      return await this.consultasService.getPendingConsultations();
    } catch (error) {
      throw new HttpException(
        `Error al obtener consultas pendientes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Ruta para obtener los casos activos de un usuario
  @Get('activos/:uid')
  @ApiOperation({ summary: 'Obtener los casos activos de un usuario' })
  @ApiResponse({ status: 200, description: 'Casos activos obtenidos correctamente' })
  async findActiveCases(@Param('uid') uid: string) {
    try {
      return await this.consultasService.getActiveCases(uid);
    } catch (error) {
      throw new HttpException(
        `Error al obtener casos activos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Ruta para obtener los detalles de una consulta por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una consulta por ID' })
  @ApiResponse({ status: 200, description: 'Consulta obtenida correctamente' })
  @ApiResponse({ status: 404, description: 'Consulta no encontrada' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.consultasService.getConsultaById(id);
    } catch (error) {
      throw new HttpException(
        `Error al obtener consulta: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Ruta para actualizar el estado de una consulta
  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado de una consulta' })
  @ApiBody({ schema: { example: { status: 'Aprobado' } } })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al actualizar estado' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    try {
      return await this.consultasService.updateConsultaStatus(id, status);
    } catch (error) {
      throw new HttpException(
        `Error al actualizar el estado: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Ruta para asignar un abogado a un caso
  @Patch(':id/asignar')
  @ApiOperation({ summary: 'Asignar un abogado a un caso' })
  @ApiBody({ schema: { example: { userId: 'UID_ABOGADO' } } })
  @ApiResponse({ status: 200, description: 'Caso asignado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al asignar caso' })
  async assignCase(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    try {
      return await this.consultasService.assignCase(id, userId);
    } catch (error) {
      throw new HttpException(
        `Error al asignar caso: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
