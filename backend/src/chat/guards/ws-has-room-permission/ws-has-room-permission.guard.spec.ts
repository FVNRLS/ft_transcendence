import { WsHasRoomPermissionGuard } from './ws-has-room-permission.guard';

describe('WsHasRoomPermissionGuard', () => {
  it('should be defined', () => {
    expect(new WsHasRoomPermissionGuard()).toBeDefined();
  });
});
