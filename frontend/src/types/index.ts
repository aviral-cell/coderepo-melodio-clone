export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // in seconds
  dateAdded: string;
  explicit: boolean;
  isPlaying?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  owner: string;
  songCount: number;
  coverArt: string;
  songs: Song[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
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
}
