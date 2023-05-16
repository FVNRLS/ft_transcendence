import { Module } from '@nestjs/common';
import { RoomsModule } from 'src/chat/rooms/rooms.module';
import { MessagesModule } from './room-messages/room-messages.module';
import { DirectMessagesModule } from './direct-messages/direct-messages.module';

@Module({
  imports: [MessagesModule, RoomsModule, DirectMessagesModule],
  exports: [MessagesModule, RoomsModule, DirectMessagesModule],
  providers: [],
})
export class ChatModule {}
