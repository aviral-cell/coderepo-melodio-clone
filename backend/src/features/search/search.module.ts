import { Module } from '@nestjs/common';

import { TracksModule } from '../tracks/tracks.module';
import { ArtistsModule } from '../artists/artists.module';
import { AlbumsModule } from '../albums/albums.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TracksModule, ArtistsModule, AlbumsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
