import { Module } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionsModule } from 'src/permissions/permissions.module';

@Module({
  imports: [PermissionsModule], 
  controllers: [RolesController], 
  providers: [RolesService, FirebaseService, PermissionsService],
})
export class RolesModule {}
