import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';

@Injectable()
export class ChatUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      throw new Error("User is not logged in");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        email: true,
        TFAMode: true,
        TFACode: true,
        TFAExpiresAt: true,
        profilePicture: true,
        // sensitive fields like hashedPasswd and salt are excluded
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserIdByUsername(username: string) {
    if (!username) {
      return null;
    }
    const user = await this.prisma.user.findUnique({
      where: { username: username },
      select: { id: true }
    });
    return user ? user.id : null;
  }
}
