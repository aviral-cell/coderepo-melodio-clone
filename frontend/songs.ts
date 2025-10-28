import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type {
  AddSongToPlaylistRequest,
  AddSongToPlaylistResponse,
  RemoveSongFromPlaylistResponse,
  SearchSongsResponse,
  GetPlaylistSongsResponse,
  GetUserPlaylistsResponse,
} from '../../types';

export const songsApi = {
  /**
   * Add a song to a playlist
   */
  async addSongToPlaylist(data: AddSongToPlaylistRequest): Promise<AddSongToPlaylistResponse> {
    return apiClient.post<AddSongToPlaylistResponse>(API_ENDPOINTS.PLAYLIST, data);
  },

  /**
   * Remove a song from a playlist
   */
  async removeSongFromPlaylist(
    songId: string, 
    userId: string, 
    playlistName: string
  ): Promise<RemoveSongFromPlaylistResponse> {
    return apiClient.delete<RemoveSongFromPlaylistResponse>(
      API_ENDPOINTS.PLAYLIST,
      { songId, userId, playlistName }
    );
  },

  /**
   * Search for songs
   */
  async searchSongs(
    query: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<SearchSongsResponse> {
    return apiClient.get<SearchSongsResponse>(API_ENDPOINTS.SEARCH, {
      q: query,
      limit,
      offset,
    });
  },

  /**
   * Get songs from a specific playlist with pagination
   */
  async getPlaylistSongs(
    userId: string,
    playlistName: string,
    cursor?: string,
    limit: number = 10
  ): Promise<GetPlaylistSongsResponse> {
    const params: Record<string, string | number> = {
      userId,
      playlistName,
      limit,
    };

    if (cursor) {
      params.cursor = cursor;
    }

    return apiClient.get<GetPlaylistSongsResponse>(API_ENDPOINTS.PLAYLIST, params);
  },

  /**
   * Get all user playlists
   */
  async getUserPlaylists(userId: string): Promise<GetUserPlaylistsResponse> {
    return apiClient.get<GetUserPlaylistsResponse>(API_ENDPOINTS.PLAYLIST_USER, {
      userId,
    });
  },
};
