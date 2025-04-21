import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { ConsultasModule } from './consultas/consultas.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { WebSocketModule } from './web-socket/web-socket.module';
import { MensajesService } from './mensajes/mensajes.service';
import { MensajesModule } from './mensajes/mensajes.module';

@Module({
  imports: [FirebaseModule, ConsultasModule, AuthModule, RolesModule, UsuariosModule, WebSocketModule, MensajesModule],
  controllers: [AppController],
  providers: [AppService, MensajesService],
})
export class AppModule {}
