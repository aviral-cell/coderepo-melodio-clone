export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  releaseDate: Date | null;
  audioUrl: string;
  imageUrl: string | null;
  isExplicit: boolean;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Playlist {
  id: string;
  playlistName: string;
  createdAt: Date;
  song: Song;
}

export interface PlaylistSongsResponse {
  data: Playlist[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface AddToPlaylistResponse {
  success: boolean;
  message: string;
  data?: Playlist;
}

export interface RemoveFromPlaylistResponse {
  success: boolean;
  message: string;
}

export interface UserPlaylist {
  playlistName: string;
  songCount: number;
  createdAt: Date;
}

export interface UserPlaylistsResponse {
  data: UserPlaylist[];
  total: number;
}
