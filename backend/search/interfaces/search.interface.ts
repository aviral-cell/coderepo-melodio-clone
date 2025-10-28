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

export interface SearchSongsResponse {
  data: Song[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
