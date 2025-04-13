import { Module } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { ConsultasController } from './consultas.controller';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [ConsultasController],
  providers: [ConsultasService, FirebaseService],  
})
export class ConsultasModule {}
