import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from './room-messages.gateway';
import { MessagesService } from './room-messages.service';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesGateway, MessagesService],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
