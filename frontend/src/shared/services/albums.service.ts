import { apiService } from './api.service';
import { AlbumWithPopulated } from '../types/album.types';
import { PaginatedResponse } from '../types/api.types';

interface AlbumQueryParams {
  page?: number;
  limit?: number;
  artistId?: string;
}

export const albumsService = {
  async getAll(params?: AlbumQueryParams): Promise<PaginatedResponse<AlbumWithPopulated>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.artistId) searchParams.set('artistId', params.artistId);

    const query = searchParams.toString();
    return apiService.get<PaginatedResponse<AlbumWithPopulated>>(`/albums${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<AlbumWithPopulated> {
    return apiService.get<AlbumWithPopulated>(`/albums/${id}`);
  },

  async search(query: string): Promise<AlbumWithPopulated[]> {
    return apiService.get<AlbumWithPopulated[]>(`/albums/search?q=${encodeURIComponent(query)}`);
  },
};
