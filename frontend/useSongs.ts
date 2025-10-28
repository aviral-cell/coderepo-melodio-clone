import { useCallback } from 'react';
import { useSongsInPlaylistStore } from '../stores/songsInPlaylistStore';

/**
 * Custom hook for managing liked songs
 */
export const useSongs = () => {
  const {
    songsInPlaylist,
    isLoading,
    error,
    hasMore,
    total,
    fetchSongs,
    loadMoreSongs,
    likeSong,
    removeLikedSong,
    clearError,
    reset,
  } = useSongsInPlaylistStore();

  // Memoized actions to prevent unnecessary re-renders
  const handleFetchPlaylistSongs = useCallback(
    (userId: string, playlistName = 'Liked Songs', resetList = false) => {
      return fetchSongs(userId, playlistName, resetList);
    },
    [fetchSongs]
  );

  const handleLoadMore = useCallback(
    (userId: string, playlistName = 'Liked Songs') => {
      return loadMoreSongs(userId, playlistName);
    },
    [loadMoreSongs]
  );

  const handleLikeSong = useCallback(
    async (songId: string, userId: string, playlistName = 'Liked Songs') => {
      try {
        await likeSong(songId, userId, playlistName);
        return true;
      } catch (error) {
        console.error('Failed to like song:', error);
        return false;
      }
    },
    [likeSong]
  );

  const handleRemoveLikedSong = useCallback(
    async (songId: string, userId: string, playlistName = 'Liked Songs') => {
      try {
        await removeLikedSong(songId, userId, playlistName);
        return true;
      } catch (error) {
        console.error('Failed to remove liked song:', error);
        return false;
      }
    },
    [removeLikedSong]
  );

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Helper function to check if a song is liked
  const isSongLiked = useCallback(
    (songId: string) => {
      return songsInPlaylist.some(ls => ls.song.id === songId);
    },
    [songsInPlaylist]
  );

  // Helper function to toggle like status
  const toggleLike = useCallback(
    async (songId: string, userId: string, playlistName = 'Liked Songs') => {
      const isLiked = isSongLiked(songId);
      
      if (isLiked) {
        return await handleRemoveLikedSong(songId, userId, playlistName);
      } else {
        return await handleLikeSong(songId, userId, playlistName);
      }
    },
    [isSongLiked, handleLikeSong, handleRemoveLikedSong]
  );

  return {
    // State
    songsInPlaylist,
    isLoading,
    error,
    hasMore,
    total,
    
    // Actions
    fetchPlaylistSongs: handleFetchPlaylistSongs,
    loadMorePlaylistSongs: handleLoadMore,
    likeSong: handleLikeSong,
    removeLikedSong: handleRemoveLikedSong,
    clearError: handleClearError,
    reset: handleReset,
    
    // Helpers
    isSongLiked,
    toggleLike,
  };
};
