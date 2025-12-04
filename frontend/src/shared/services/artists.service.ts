import { apiService } from './api.service';
import { Artist } from '../types/artist.types';
import { PaginatedResponse } from '../types/api.types';

interface ArtistQueryParams {
  page?: number;
  limit?: number;
}

export const artistsService = {
  async getAll(params?: ArtistQueryParams): Promise<PaginatedResponse<Artist>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return apiService.get<PaginatedResponse<Artist>>(`/artists${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<Artist> {
    return apiService.get<Artist>(`/artists/${id}`);
  },

  async search(query: string): Promise<Artist[]> {
    return apiService.get<Artist[]>(`/artists/search?q=${encodeURIComponent(query)}`);
  },
};
