import { TrackWithPopulated } from './track.types';

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  trackIds: string[] | TrackWithPopulated[];
  coverImageUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistWithTracks extends Omit<Playlist, 'trackIds'> {
  trackIds: TrackWithPopulated[];
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}
