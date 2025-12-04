import { Injectable } from '@nestjs/common';

import { TracksService } from '../tracks/tracks.service';
import { ArtistsService } from '../artists/artists.service';
import { AlbumsService } from '../albums/albums.service';
import { TrackDocument } from '../tracks/schemas/track.schema';
import { ArtistDocument } from '../artists/schemas/artist.schema';
import { AlbumDocument } from '../albums/schemas/album.schema';

export interface SearchResults {
  tracks: TrackDocument[];
  artists: ArtistDocument[];
  albums: AlbumDocument[];
}

@Injectable()
export class SearchService {
  constructor(
    private readonly tracksService: TracksService,
    private readonly artistsService: ArtistsService,
    private readonly albumsService: AlbumsService,
  ) {}

  async search(query: string): Promise<SearchResults> {
    const [tracks, artists, albums] = await Promise.all([
      this.tracksService.search(query, 5),
      this.artistsService.search(query, 5),
      this.albumsService.search(query, 5),
    ]);

    return {
      tracks,
      artists,
      albums,
    };
  }
}
