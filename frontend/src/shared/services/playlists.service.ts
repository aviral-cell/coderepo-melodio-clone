import { apiService } from './api.service';
import {
  Playlist,
  PlaylistWithTracks,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from '../types/playlist.types';

export const playlistsService = {
  async getAll(): Promise<Playlist[]> {
    return apiService.get<Playlist[]>('/playlists');
  },

  async getById(id: string): Promise<PlaylistWithTracks> {
    return apiService.get<PlaylistWithTracks>(`/playlists/${id}`);
  },

  async create(input: CreatePlaylistInput): Promise<Playlist> {
    return apiService.post<Playlist>('/playlists', input);
  },

  async update(id: string, input: UpdatePlaylistInput): Promise<Playlist> {
    return apiService.patch<Playlist>(`/playlists/${id}`, input);
  },

  async delete(id: string): Promise<void> {
    await apiService.delete(`/playlists/${id}`);
  },

  async addTrack(playlistId: string, trackId: string): Promise<Playlist> {
    return apiService.post<Playlist>(`/playlists/${playlistId}/tracks`, { trackId });
  },

  async removeTrack(playlistId: string, trackId: string): Promise<Playlist> {
    return apiService.delete<Playlist>(`/playlists/${playlistId}/tracks/${trackId}`);
  },

  async reorderTracks(playlistId: string, trackIds: string[]): Promise<Playlist> {
    return apiService.patch<Playlist>(`/playlists/${playlistId}/reorder`, { trackIds });
  },
};
