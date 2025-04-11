import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirestoreController } from './firebase.controller';

@Module({
  controllers: [FirestoreController],
  providers: [FirebaseService],
  exports: [FirebaseService], 
})
export class FirebaseModule {}
