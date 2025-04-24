import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}


  @Get('total')
  @ApiOperation({ summary: 'Obtener el total de usuarios' })
  @ApiResponse({ status: 200, description: 'Total de usuarios' })
  async getTotalUsuarios() {
    return await this.dashboardService.getTotalUsuarios();
  }

   
   @Get('/roles')
   async getUsuariosPorRol() {
     return await this.dashboardService.getUsuariosPorRol();
   }

}
