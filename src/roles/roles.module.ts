import { Module } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';


@Module({
  imports: [], 
  controllers: [RolesController], 
  providers: [RolesService, FirebaseService],
  exports: [RolesService],
})
export class RolesModule {}
