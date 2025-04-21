import { Module } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';
import { WebSocketModule } from 'src/web-socket/web-socket.module';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [FirebaseModule, WebSocketModule],
  controllers: [MensajesController],
  providers: [MensajesService],
})
export class MensajesModule {}
