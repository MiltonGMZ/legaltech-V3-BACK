import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { ConsultasModule } from './consultas/consultas.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [FirebaseModule, ConsultasModule, AuthModule, RolesModule, PermissionsModule, UsuariosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
