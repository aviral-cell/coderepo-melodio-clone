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

// Hook types for usePlaylistOperations
export interface UsePlaylistOperationsProps {
  playlistId: string;
  playlist: PlaylistWithTracks | null;
  setPlaylist: React.Dispatch<React.SetStateAction<PlaylistWithTracks | null>>;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export interface UsePlaylistOperationsReturn {
  reorderTracks: (oldIndex: number, newIndex: number) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  isReordering: boolean;
  isRemoving: boolean;
}
