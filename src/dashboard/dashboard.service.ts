import { Injectable } from '@nestjs/common';
import { UsuariosService } from 'src/usuarios/usuarios.service';

@Injectable()
export class DashboardService {
constructor(private readonly usuariosService: UsuariosService) {}

    async getTotalUsuarios() {
        const usuarios = await this.usuariosService.getAllUsuarios();
        return { total: usuarios.length }; 
      }

      async getUsuariosPorRol() {
        const usuarios = await this.usuariosService.getAllUsuarios();
        const usuariosPorRol = usuarios.reduce((acc, user: { uid: string; role: string }) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        return usuariosPorRol;
      }


}
