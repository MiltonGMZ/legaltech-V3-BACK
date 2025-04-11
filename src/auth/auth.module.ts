import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  imports: [FirebaseModule, PermissionsModule],
  providers: [AuthService, FirebaseService],
  controllers: [AuthController],
})
export class AuthModule {}
