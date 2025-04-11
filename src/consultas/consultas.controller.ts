import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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

  @Post()
  @ApiOperation({ summary: 'Crear una nueva preconsulta jurídica' })
  @ApiBody({ type: CreatePreConsultaDto })
  @ApiResponse({ status: 201, description: 'Consulta creada correctamente' })
  async create(@Body() createPreConsultaDto: CreatePreConsultaDto) {
    return await this.consultasService.saveConsulta(createPreConsultaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las consultas registradas' })
  async findAll() {
    return await this.consultasService.getAllConsultas();
  }

  @Get('pendientes')
  @ApiOperation({ summary: 'Obtener solo las consultas pendientes' })
  async findPending() {
    return await this.consultasService.getPendingConsultations();
  }

  @Get('activos/:uid')
  @ApiOperation({ summary: 'Obtener los casos activos de un usuario' })
  async findActiveCases(@Param('uid') uid: string) {
    return await this.consultasService.getActiveCases(uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una consulta por ID' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.consultasService.getConsultaById(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado de una consulta' })
  @ApiBody({ schema: { example: { status: 'Aprobado' } } })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return await this.consultasService.updateConsultaStatus(id, status);
  }

  @Patch(':id/asignar')
  @ApiOperation({ summary: 'Asignar un abogado a un caso' })
  @ApiBody({ schema: { example: { userId: 'UID_ABOGADO' } } })
  async assignCase(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return await this.consultasService.assignCase(id, userId);
  }
}
