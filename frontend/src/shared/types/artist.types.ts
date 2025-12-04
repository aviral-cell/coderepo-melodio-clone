export interface Artist {
  _id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  genres: string[];
  followerCount: number;
  createdAt: string;
  updatedAt: string;
}
