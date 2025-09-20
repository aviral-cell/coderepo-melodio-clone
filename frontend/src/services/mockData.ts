import type { Song, Playlist, User } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'hackerrank11',
  email: 'hackerrank11@example.com',
  avatar: 'https://via.placeholder.com/40x40/1db954/ffffff?text=O'
};

export const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Baby',
    artist: 'Justin Bieber',
    album: 'DS2 (Deluxe)',
    albumArt: 'https://via.placeholder.com/40x40/1db954/ffffff?text=DS2',
    duration: 183, // 3:03
    dateAdded: 'Oct 30, 2015',
    explicit: true,
    isPlaying: true
  },
  {
    id: '2',
    title: 'Stick Talk',
    artist: 'Future',
    album: 'DS2 (Deluxe)',
    albumArt: 'https://via.placeholder.com/40x40/1db954/ffffff?text=DS2',
    duration: 171, // 2:51
    dateAdded: 'Oct 30, 2015',
    explicit: true
  },
  {
    id: '3',
    title: 'Antidote',
    artist: 'Travis Scott',
    album: 'Rodeo',
    albumArt: 'https://via.placeholder.com/40x40/1db954/ffffff?text=R',
    duration: 262, // 4:22
    dateAdded: 'Oct 30, 2015',
    explicit: true
  },
  {
    id: '4',
    title: 'Man Of The Year',
    artist: 'ScHoolboy Q',
    album: 'Man Of The Year',
    albumArt: 'https://via.placeholder.com/40x40/1db954/ffffff?text=M',
    duration: 216, // 3:36
    dateAdded: 'Oct 30, 2015',
    explicit: false
  },
  {
    id: '5',
    title: 'Studio',
    artist: 'ScHoolboy Q, BJ The Chicago Kid',
    album: 'Oxymoron (Deluxe)',
    albumArt: 'https://via.placeholder.com/40x40/1db954/ffffff?text=O',
    duration: 278, // 4:38
    dateAdded: 'Oct 30, 2015',
    explicit: false
  },
  {
    id: '6',
    title: 'Twist My Fingaz',
    artist: 'YG',
    album: 'Twist My Fingaz',
    albumArt: 'https://via.placeholder.com/40x40/1db954/ffffff?text=T',
    duration: 255, // 4:15
    dateAdded: 'Oct 30, 2015',
    explicit: true
  }
];

export const mockLikedSongsPlaylist: Playlist = {
  id: 'liked-songs',
  name: 'Liked Songs',
  description: 'Songs you liked',
  owner: mockUser.name,
  songCount: mockSongs.length,
  coverArt: 'https://via.placeholder.com/232x232/1db954/ffffff?text=❤️',
  songs: mockSongs
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
