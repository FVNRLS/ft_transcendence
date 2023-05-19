import { Module } from '@nestjs/common';
import { RoomsModule } from 'src/chat/rooms/rooms.module';
import { MessagesModule } from './room-messages/room-messages.module';

@Module({
  imports: [MessagesModule, RoomsModule],
  exports: [MessagesModule, RoomsModule,],
  providers: [],
})
export class ChatModule {}
