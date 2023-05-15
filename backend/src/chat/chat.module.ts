import { Module } from '@nestjs/common';
import { RoomsModule } from 'src/chat/rooms/rooms.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [MessagesModule, RoomsModule],
  exports: [MessagesModule, RoomsModule],
})
export class ChatModule {}
