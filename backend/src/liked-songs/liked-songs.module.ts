import { Module } from '@nestjs/common';
import { LikedSongsController } from './controllers/liked-songs.controller';
import { LikedSongsService } from './services/liked-songs.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LikedSongsController],
  providers: [LikedSongsService, PrismaService],
  exports: [LikedSongsService],
})
export class LikedSongsModule {}
