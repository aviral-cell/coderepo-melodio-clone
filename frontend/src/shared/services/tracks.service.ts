import { apiService } from './api.service';
import { TrackWithPopulated } from '../types/track.types';
import { PaginatedResponse } from '../types/api.types';

interface TrackQueryParams {
  page?: number;
  limit?: number;
  genre?: string;
  artistId?: string;
  albumId?: string;
}

export const tracksService = {
  async getAll(params?: TrackQueryParams): Promise<PaginatedResponse<TrackWithPopulated>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.genre) searchParams.set('genre', params.genre);
    if (params?.artistId) searchParams.set('artistId', params.artistId);
    if (params?.albumId) searchParams.set('albumId', params.albumId);

    const query = searchParams.toString();
    return apiService.get<PaginatedResponse<TrackWithPopulated>>(`/tracks${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<TrackWithPopulated> {
    return apiService.get<TrackWithPopulated>(`/tracks/${id}`);
  },

  async search(query: string): Promise<TrackWithPopulated[]> {
    return apiService.get<TrackWithPopulated[]>(`/tracks/search?q=${encodeURIComponent(query)}`);
  },

  async logPlay(id: string): Promise<TrackWithPopulated> {
    return apiService.post<TrackWithPopulated>(`/tracks/${id}/play`);
  },
};
