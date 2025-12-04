import { Artist } from './artist.types';

export interface Album {
  _id: string;
  title: string;
  artistId: string | Artist;
  releaseDate: string;
  coverImageUrl?: string;
  totalTracks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumWithPopulated extends Omit<Album, 'artistId'> {
  artistId: Pick<Artist, '_id' | 'name' | 'imageUrl'>;
}
