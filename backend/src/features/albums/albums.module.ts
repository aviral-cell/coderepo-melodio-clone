import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Album, AlbumSchema } from './schemas/album.schema';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Album.name, schema: AlbumSchema }]),
  ],
  controllers: [AlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
