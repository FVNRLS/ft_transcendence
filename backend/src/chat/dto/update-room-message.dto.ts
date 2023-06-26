import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-room-message.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  id: number;
}
