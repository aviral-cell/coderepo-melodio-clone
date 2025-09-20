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

export interface LikedSong {
  id: string;
  createdAt: Date;
  song: Song;
}

export interface LikedSongsResponse {
  data: LikedSong[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface LikeSongResponse {
  success: boolean;
  message: string;
  data?: LikedSong;
}

export interface RemoveLikedSongResponse {
  success: boolean;
  message: string;
}
