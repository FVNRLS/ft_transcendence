import { Module } from '@nestjs/common';
import { RoomsModule } from 'src/chat/rooms/rooms.module';
import { MessagesModule } from './room-messages/room-messages.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [MessagesModule, RoomsModule, AuthModule],
  exports: [MessagesModule, RoomsModule, AuthModule],
  providers: [],
})
export class ChatModule {}
