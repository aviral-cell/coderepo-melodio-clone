import { Artist } from './artist.types';
import { Album } from './album.types';

export interface Track {
  _id: string;
  title: string;
  artistId: string | Artist;
  albumId: string | Album;
  durationInSeconds: number;
  trackNumber: number;
  genre: string;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackWithPopulated extends Omit<Track, 'artistId' | 'albumId'> {
  artistId: Pick<Artist, '_id' | 'name' | 'imageUrl'>;
  albumId: Pick<Album, '_id' | 'title' | 'coverImageUrl'>;
}
