import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { ConsultasModule } from './consultas/consultas.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileUploadModule } from './file-upload/file-upload.module';


@Module({
  imports: [
    FirebaseModule, 
    ConsultasModule, 
    AuthModule, 
    RolesModule, 
    UsuariosModule, 
    DashboardModule,
    FileUploadModule,
    ChatModule,
     MulterModule.register({
      storage: memoryStorage(),
    }),
     
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService, 
    DashboardService],
})
export class AppModule {}
