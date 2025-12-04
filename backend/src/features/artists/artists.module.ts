import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Artist, ArtistSchema } from './schemas/artist.schema';
import { ArtistsService } from './artists.service';
import { ArtistsController } from './artists.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artist.name, schema: ArtistSchema }]),
  ],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [ArtistsService],
})
export class ArtistsModule {}
