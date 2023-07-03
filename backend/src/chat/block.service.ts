/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BlockService { 
    constructor(
        private readonly prisma: PrismaService,
        ) {}


    async getBlockedUsers(userId: number) {
        return this.prisma.block.findMany({
            where: { blockerId: userId },
        });
    }

    async getBlockerUsers(userId: number) {
        return this.prisma.block.findMany({
            where: { blockedId: userId },
        });
    }

    async blockUser(blockerId: number, blockedId: number) {
        // Check if this block relation already exists
        const existingBlock = await this.prisma.block.findFirst({
            where: {
            blockerId: blockerId,
            blockedId: blockedId,
            },
        });
        
        if (existingBlock) {
            return { success: true, message: 'User already blocked.' };
        }
        
        // Check if blockedId is defined
        if (blockedId === undefined) {
            throw new Error('BlockedId is undefined');
        }
        
        // Create the block relation
        const newBlock = await this.prisma.block.create({
            data: {
            blockerId: blockerId,
            blockedId: blockedId,
            },
        });
        
        return { success: true, message: 'User successfully blocked.', block: newBlock };
        }
        
    async unblockUser(blockerId: number, blockedId: number) {
    // Check if this block relation exists
    const existingBlock = await this.prisma.block.findFirst({
        where: {
        blockerId: blockerId,
        blockedId: blockedId,
        },
    });
    
    if (!existingBlock) {
        return { success: true, message: 'Block relation does not exist.' };
    }
    
    // Delete the block relation
    await this.prisma.block.delete({
        where: {
        id: existingBlock.id,
        },
    });
    
        return { success: true, message: 'User successfully unblocked.' };
    }

    async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
        const block = await this.prisma.block.findFirst({
          where: {
            blockerId: blockerId,
            blockedId: blockedId,
          },
        });
      
        return block !== null;
      }
}
