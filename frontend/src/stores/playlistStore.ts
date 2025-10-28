import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { songsApi } from '../services/api';
import type { 
  UserPlaylist, 
  GetUserPlaylistsResponse,
  ApiError 
} from '../types';

interface PlaylistState {
  // User's playlists
  userPlaylists: UserPlaylist[];
  userPlaylistsLoading: boolean;
  userPlaylistsError: ApiError | null;
  
  // Currently selected playlist name (for LikedSongs component to use)
  selectedPlaylistName: string | null;
  
  // Actions
  fetchUserPlaylists: (userId: string) => Promise<void>;
  selectPlaylist: (playlistName: string | null) => void;
  clearErrors: () => void;
  reset: () => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  devtools(
    (set, get) => ({
      // Initial state
      userPlaylists: [],
      userPlaylistsLoading: false,
      userPlaylistsError: null,
      selectedPlaylistName: null,

      // Actions
      fetchUserPlaylists: async (userId: string) => {
        const { userPlaylistsLoading } = get();
        
        if (userPlaylistsLoading) return;

        set({ userPlaylistsLoading: true, userPlaylistsError: null });

        try {
          const response: GetUserPlaylistsResponse = await songsApi.getUserPlaylists(userId);
          
          set({
            userPlaylists: response.data,
            userPlaylistsLoading: false,
          });
        } catch (error) {
          set({
            userPlaylistsError: error as ApiError,
            userPlaylistsLoading: false,
          });
        }
      },

      selectPlaylist: (playlistName: string | null) => {
        set({ selectedPlaylistName: playlistName });
      },

      clearErrors: () => {
        set({ userPlaylistsError: null });
      },

      reset: () => {
        set({
          userPlaylists: [],
          userPlaylistsLoading: false,
          userPlaylistsError: null,
          selectedPlaylistName: null,
        });
      },
    }),
    {
      name: 'playlist-store',
    }
  )
);

// Simple hook for playlist management
export const usePlaylists = () => {
  const store = usePlaylistStore();
  
  return {
    userPlaylists: store.userPlaylists,
    userPlaylistsLoading: store.userPlaylistsLoading,
    userPlaylistsError: store.userPlaylistsError,
    selectedPlaylistName: store.selectedPlaylistName,
    fetchUserPlaylists: store.fetchUserPlaylists,
    selectPlaylist: store.selectPlaylist,
    clearErrors: store.clearErrors,
    reset: store.reset,
  };
};
