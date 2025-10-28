import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { songsApi } from '../services/api';
import type { PlaylistEntry, ApiError } from '../types';

interface SongsInPlaylistState {
  // State
  playlistName: string;
  songsInPlaylist: PlaylistEntry[];
  isLoading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;

  // Actions
  fetchSongs: (userId: string, playlistName?: string, reset?: boolean) => Promise<void>;
  loadMoreSongs: (userId: string, playlistName?: string) => Promise<void>;
  likeSong: (songId: string, userId: string, playlistName?: string) => Promise<void>;
  removeLikedSong: (songId: string, userId: string, playlistName?: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useSongsInPlaylistStore = create<SongsInPlaylistState>()(
  devtools(
    (set, get) => ({
      // Initial state
      songsInPlaylist: [],
      isLoading: false,
      error: null,
      hasMore: true,
      nextCursor: null,
      total: 0,
      playlistName: 'Liked Songs',

      // Actions
      fetchSongs: async (userId: string, playlistName = 'Liked Songs', reset = false) => {
        const { isLoading } = get();
        
        if (isLoading) return;

        set({ isLoading: true, error: null, playlistName });

        try {
          const response = await songsApi.getPlaylistSongs(userId, playlistName);
          
          set({
            songsInPlaylist: reset ? response.data : [...get().songsInPlaylist, ...response.data],
            hasMore: response.hasMore,
            nextCursor: response.nextCursor,
            total: response.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
        }
      },

      loadMoreSongs: async (userId: string, playlistName = 'Liked Songs') => {
        const { isLoading, hasMore, nextCursor } = get();
        
        if (isLoading || !hasMore || !nextCursor) return;

        set({ isLoading: true, error: null });

        try {
          const response = await songsApi.getPlaylistSongs(userId, playlistName, nextCursor);
          
          set({
            songsInPlaylist: [...get().songsInPlaylist, ...response.data],
            hasMore: response.hasMore,
            nextCursor: response.nextCursor,
            total: response.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
        }
      },

      likeSong: async (songId: string, userId: string, playlistName = 'Liked Songs') => {
        const { isLoading } = get();
        
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await songsApi.addSongToPlaylist({ songId, userId, playlistName });
          
          set({
            songsInPlaylist: [response.data, ...get().songsInPlaylist],
            total: get().total + 1,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
          throw error; // Re-throw to allow component to handle
        }
      },

      removeLikedSong: async (songId: string, userId: string, playlistName = 'Liked Songs') => {
        const { isLoading } = get();
        
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          await songsApi.removeSongFromPlaylist(songId, userId, playlistName);
          
          set({
            songsInPlaylist: get().songsInPlaylist.filter(ls => ls.song.id !== songId),
            total: Math.max(0, get().total - 1),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
          throw error; // Re-throw to allow component to handle
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          songsInPlaylist: [],
          isLoading: false,
          error: null,
          hasMore: true,
          nextCursor: null,
          total: 0,
          playlistName: 'Liked Songs',
        });
      },
    }),
    {
      name: 'songs-in-playlist-store',
    }
  )
);
