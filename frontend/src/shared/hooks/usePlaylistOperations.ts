import { useState, useCallback } from 'react';

import { playlistsService } from '../services/playlists.service';
import {
  UsePlaylistOperationsProps,
  UsePlaylistOperationsReturn,
} from '../types/playlist.types';

/**
 * Custom hook for playlist track operations with optimistic updates
 * Handles reordering and removing tracks with rollback on error
 */
export function usePlaylistOperations({
  playlistId,
  playlist,
  setPlaylist,
  onError,
  onSuccess,
}: UsePlaylistOperationsProps): UsePlaylistOperationsReturn {
  const [isReordering, setIsReordering] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  /**
   * Reorders tracks in the playlist using drag & drop indices
   * Implements optimistic UI update with rollback on failure
   */
  const reorderTracks = useCallback(
    async (oldIndex: number, newIndex: number): Promise<void> => {
      if (!playlist) return;
      if (oldIndex === newIndex) return;

      // Store original state for rollback
      const originalTracks = [...playlist.trackIds];

      // Optimistic update: reorder tracks locally
      const reorderedTracks = [...playlist.trackIds];
      const [movedTrack] = reorderedTracks.splice(oldIndex, 1);
      reorderedTracks.splice(newIndex, 0, movedTrack);

      setPlaylist({
        ...playlist,
        trackIds: reorderedTracks,
      });

      setIsReordering(true);

      try {
        // Extract track IDs for API call
        const trackIds = reorderedTracks.map((track) => track._id);
        await playlistsService.reorderTracks(playlistId, trackIds);
        onSuccess?.('Tracks reordered successfully');
      } catch (error) {
        // Rollback on error
        setPlaylist({
          ...playlist,
          trackIds: originalTracks,
        });
        onError?.('Failed to reorder tracks');
      } finally {
        setIsReordering(false);
      }
    },
    [playlist, playlistId, setPlaylist, onError, onSuccess]
  );

  /**
   * Removes a track from the playlist by trackId
   * Implements optimistic UI update with rollback on failure
   */
  const removeTrack = useCallback(
    async (trackId: string): Promise<void> => {
      if (!playlist) return;

      // Store original state for rollback
      const originalTracks = [...playlist.trackIds];

      // Optimistic update: remove track locally
      const filteredTracks = playlist.trackIds.filter(
        (track) => track._id !== trackId
      );

      setPlaylist({
        ...playlist,
        trackIds: filteredTracks,
      });

      setIsRemoving(true);

      try {
        await playlistsService.removeTrack(playlistId, trackId);
        onSuccess?.('Track removed from playlist');
      } catch (error) {
        // Rollback on error
        setPlaylist({
          ...playlist,
          trackIds: originalTracks,
        });
        onError?.('Failed to remove track');
      } finally {
        setIsRemoving(false);
      }
    },
    [playlist, playlistId, setPlaylist, onError, onSuccess]
  );

  return {
    reorderTracks,
    removeTrack,
    isReordering,
    isRemoving,
  };
}
