import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { RolesService } from 'src/roles/roles.service';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [FirebaseModule, RolesModule],
  providers: [AuthService, FirebaseService, RolesService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
