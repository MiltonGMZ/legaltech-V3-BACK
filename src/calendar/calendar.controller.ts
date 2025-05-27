import { Body, Controller, Get, Param, Post, NotFoundException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCitaDto } from 'src/common/dtos/cita.dto';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  async crearCita(@Body() createCitaDto: CreateCitaDto) {
    return await this.calendarService.crearCita(createCitaDto);
  }

  @Get('abogado/:id')
  async obtenerCitasPorAbogado(@Param('id') abogadoId: string) {
    return await this.calendarService.obtenerCitasPorAbogado(abogadoId);
  }

  @Get('consulta/:consultaId/clienteId')
  async obtenerClienteIdPorConsulta(@Param('consultaId') consultaId: string) {
    const clienteId = await this.calendarService.obtenerClienteIdPorConsulta(consultaId);
    if (!clienteId) throw new NotFoundException('Cliente no encontrado para esa consulta');
    return { clienteId };
  }

  @Get('consulta/:consultaId/citas')
  async obtenerCitasPorConsulta(@Param('consultaId') consultaId: string) {
    return await this.calendarService.obtenerCitasPorConsulta(consultaId);
  }
}
