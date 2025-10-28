export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number; // in seconds
  releaseDate: string | null;
  audioUrl: string;
  imageUrl: string | null;
  isExplicit: boolean;
  playCount: number;
  createdAt: string;
  updatedAt: string;
  isPlaying?: boolean;
}


export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isShuffled: boolean;
  isRepeating: boolean;
  queue: Song[];
}

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  handlePlayClick: (playlist?: Song[]) => void;
}

// API Response Types
export interface PlaylistEntry {
  id: string;
  playlistName: string;
  createdAt: string;
  song: Song;
}

export interface AddSongToPlaylistRequest {
  songId: string;
  userId: string;
  playlistName: string;
}

export interface AddSongToPlaylistResponse {
  success: boolean;
  message: string;
  data: PlaylistEntry;
}

export interface RemoveSongFromPlaylistResponse {
  success: boolean;
  message: string;
}

export interface SearchSongsResponse {
  data: Song[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetPlaylistSongsResponse {
  data: PlaylistEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface UserPlaylist {
  playlistName: string;
  songCount: number;
  createdAt: string;
}

export interface GetUserPlaylistsResponse {
  data: UserPlaylist[];
  total: number;
}


export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
