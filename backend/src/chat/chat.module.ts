import { Module } from '@nestjs/common';
import { RoomsModule } from 'src/chat/rooms/rooms.module';
import { MessagesModule } from './room-messages/room-messages.module';
import { ChatAuthModule } from './auth/chat_auth.module';

@Module({
  imports: [ChatAuthModule, RoomsModule, MessagesModule],
  exports: [ChatAuthModule, RoomsModule, MessagesModule],
  providers: [],
})
export class ChatModule {}
