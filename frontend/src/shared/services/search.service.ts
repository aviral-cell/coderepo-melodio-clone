import { apiService } from './api.service';
import { TrackWithPopulated } from '../types/track.types';
import { Artist } from '../types/artist.types';
import { AlbumWithPopulated } from '../types/album.types';

interface SearchResults {
  tracks: TrackWithPopulated[];
  artists: Artist[];
  albums: AlbumWithPopulated[];
}

export const searchService = {
  async search(query: string): Promise<SearchResults> {
    return apiService.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`);
  },
};
