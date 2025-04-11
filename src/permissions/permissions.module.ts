import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { FirebaseService } from 'src/firebase/firebase.service';



@Module({
  imports: [FirebaseModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, FirebaseService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
