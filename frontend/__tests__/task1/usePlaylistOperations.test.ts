/**
 * @file usePlaylistOperations.test.ts
 * @description Unit tests for the usePlaylistOperations custom hook.
 *
 * This hook manages playlist track operations including reordering and removing tracks.
 * It implements the optimistic update pattern for responsive UI, with automatic rollback
 * on API failures.
 *
 * @module __tests__/task1/usePlaylistOperations.test
 *
 * Test Coverage:
 * - reorderTracks: Drag-and-drop track reordering with array splice operations
 * - removeTrack: Track deletion from playlist
 * - Optimistic updates: Immediate UI feedback before API confirmation
 * - Rollback behavior: Automatic state restoration on API errors
 * - Loading states: isReordering and isRemoving flags
 * - API service integration: playlistsService method calls
 */
import { renderHook, act, waitFor } from '@testing-library/react';

import { usePlaylistOperations } from '@/shared/hooks/usePlaylistOperations';
import { playlistsService } from '@/shared/services/playlists.service';
import { apiService } from '@/shared/services/api.service';
import { PlaylistWithTracks, Playlist } from '@/shared/types/playlist.types';
import { TrackWithPopulated } from '@/shared/types/track.types';

jest.mock('@/shared/services/playlists.service');
jest.mock('@/shared/services/api.service');

const mockPlaylistsService = playlistsService as jest.Mocked<typeof playlistsService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Factory function to create mock track
function createMockTrack(overrides: Partial<TrackWithPopulated> = {}): TrackWithPopulated {
  const id = overrides._id || `track-${Math.random().toString(36).substring(7)}`;
  return {
    _id: id,
    title: `Track ${id}`,
    artistId: {
      _id: 'artist-1',
      name: 'Test Artist',
      imageUrl: 'https://example.com/artist.jpg',
    },
    albumId: {
      _id: 'album-1',
      title: 'Test Album',
      coverImageUrl: 'https://example.com/album.jpg',
    },
    durationInSeconds: 180,
    trackNumber: 1,
    genre: 'Pop',
    playCount: 100,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Factory function to create mock playlist
function createMockPlaylist(
  trackIds: TrackWithPopulated[] = [],
  overrides: Partial<PlaylistWithTracks> = {}
): PlaylistWithTracks {
  return {
    _id: 'playlist-1',
    name: 'Test Playlist',
    description: 'A test playlist',
    ownerId: 'user-1',
    trackIds,
    coverImageUrl: 'https://example.com/playlist.jpg',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Test Suite: usePlaylistOperations Hook
 *
 * Tests the custom hook that manages playlist track operations.
 * Uses mocked services to verify optimistic updates, API calls, and rollback behavior.
 */
describe('usePlaylistOperations', () => {
  const mockSetPlaylist = jest.fn();
  const mockOnError = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * reorderTracks Tests
   *
   * Tests the drag-and-drop track reordering functionality.
   * Verifies correct array manipulation, optimistic updates, and rollback on failure.
   */
  describe('reorderTracks', () => {
    // Verifies moving the first track to the last position: [1,2,3] -> [2,3,1]
    it('should reorder tracks from index 0 to index 2 (move first to last)', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const track3 = createMockTrack({ _id: 'track-3', title: 'Track 3' });
      const playlist = createMockPlaylist([track1, track2, track3]);

      mockPlaylistsService.reorderTracks.mockResolvedValueOnce({} as never);

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      await act(async () => {
        await result.current.reorderTracks(0, 2);
      });

      // Verify setPlaylist was called with reordered tracks [track2, track3, track1]
      expect(mockSetPlaylist).toHaveBeenCalledWith({
        ...playlist,
        trackIds: [track2, track3, track1],
      });

      // Verify API was called with correct track IDs
      expect(mockPlaylistsService.reorderTracks).toHaveBeenCalledWith('playlist-1', [
        'track-2',
        'track-3',
        'track-1',
      ]);

      // Verify success callback was called
      expect(mockOnSuccess).toHaveBeenCalledWith('Tracks reordered successfully');
      expect(mockOnError).not.toHaveBeenCalled();
    });

    // Verifies moving the last track to the first position: [1,2,3] -> [3,1,2]
    it('should reorder tracks from index 2 to index 0 (move last to first)', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const track3 = createMockTrack({ _id: 'track-3', title: 'Track 3' });
      const playlist = createMockPlaylist([track1, track2, track3]);

      mockPlaylistsService.reorderTracks.mockResolvedValueOnce({} as never);

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      await act(async () => {
        await result.current.reorderTracks(2, 0);
      });

      // Verify setPlaylist was called with reordered tracks [track3, track1, track2]
      expect(mockSetPlaylist).toHaveBeenCalledWith({
        ...playlist,
        trackIds: [track3, track1, track2],
      });

      // Verify API was called with correct track IDs
      expect(mockPlaylistsService.reorderTracks).toHaveBeenCalledWith('playlist-1', [
        'track-3',
        'track-1',
        'track-2',
      ]);

      expect(mockOnSuccess).toHaveBeenCalledWith('Tracks reordered successfully');
    });

    // Verifies that UI is updated immediately before the API call completes
    it('should perform optimistic update before API resolves', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const playlist = createMockPlaylist([track1, track2]);

      // Create a promise that we can control
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockPlaylistsService.reorderTracks.mockImplementationOnce(
        () => pendingPromise as unknown as Promise<never>
      );

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      // Start the reorder operation but don't await it yet
      let reorderPromise: Promise<void>;
      act(() => {
        reorderPromise = result.current.reorderTracks(0, 1);
      });

      // Verify optimistic update happened immediately (before API resolves)
      expect(mockSetPlaylist).toHaveBeenCalledWith({
        ...playlist,
        trackIds: [track2, track1],
      });

      // Verify isReordering is true while API is pending
      expect(result.current.isReordering).toBe(true);

      // Now resolve the API call
      await act(async () => {
        resolvePromise!();
        await reorderPromise;
      });

      // Verify isReordering is false after completion
      expect(result.current.isReordering).toBe(false);
    });

    // Verifies that state is restored when API call fails (optimistic update rollback)
    it('should rollback to original order on API failure', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const track3 = createMockTrack({ _id: 'track-3', title: 'Track 3' });
      const playlist = createMockPlaylist([track1, track2, track3]);

      mockPlaylistsService.reorderTracks.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      await act(async () => {
        await result.current.reorderTracks(0, 2);
      });

      // Verify first call was optimistic update
      expect(mockSetPlaylist).toHaveBeenNthCalledWith(1, {
        ...playlist,
        trackIds: [track2, track3, track1],
      });

      // Verify second call was rollback to original order
      expect(mockSetPlaylist).toHaveBeenNthCalledWith(2, {
        ...playlist,
        trackIds: [track1, track2, track3],
      });

      // Verify error callback was called
      expect(mockOnError).toHaveBeenCalledWith('Failed to reorder tracks');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    // Verifies that no-op reorders (same position) are handled efficiently
    it('should NOT call setPlaylist when oldIndex equals newIndex', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const playlist = createMockPlaylist([track1, track2]);

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      await act(async () => {
        await result.current.reorderTracks(1, 1);
      });

      // setPlaylist should never be called when indices are equal
      expect(mockSetPlaylist).not.toHaveBeenCalled();

      // API should never be called
      expect(mockPlaylistsService.reorderTracks).not.toHaveBeenCalled();

      // No callbacks should be triggered
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  /**
   * removeTrack Tests
   *
   * Tests the track removal functionality from playlists.
   * Verifies correct array filtering, optimistic updates, and rollback on failure.
   */
  describe('removeTrack', () => {
    // Verifies successful track removal with proper state update and API call
    it('should remove track by trackId', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const track3 = createMockTrack({ _id: 'track-3', title: 'Track 3' });
      const playlist = createMockPlaylist([track1, track2, track3]);

      mockPlaylistsService.removeTrack.mockResolvedValueOnce({} as never);

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      await act(async () => {
        await result.current.removeTrack('track-2');
      });

      // Verify setPlaylist was called with track removed
      expect(mockSetPlaylist).toHaveBeenCalledWith({
        ...playlist,
        trackIds: [track1, track3],
      });

      // Verify API was called with correct parameters
      expect(mockPlaylistsService.removeTrack).toHaveBeenCalledWith('playlist-1', 'track-2');

      // Verify success callback was called
      expect(mockOnSuccess).toHaveBeenCalledWith('Track removed from playlist');
      expect(mockOnError).not.toHaveBeenCalled();
    });

    // Verifies that UI is updated immediately before the API call completes
    it('should perform optimistic update before API resolves', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const playlist = createMockPlaylist([track1, track2]);

      // Create a promise that we can control
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockPlaylistsService.removeTrack.mockImplementationOnce(
        () => pendingPromise as unknown as Promise<never>
      );

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      // Start the remove operation but don't await it yet
      let removePromise: Promise<void>;
      act(() => {
        removePromise = result.current.removeTrack('track-1');
      });

      // Verify optimistic update happened immediately (before API resolves)
      expect(mockSetPlaylist).toHaveBeenCalledWith({
        ...playlist,
        trackIds: [track2],
      });

      // Verify isRemoving is true while API is pending
      expect(result.current.isRemoving).toBe(true);

      // Now resolve the API call
      await act(async () => {
        resolvePromise!();
        await removePromise;
      });

      // Verify isRemoving is false after completion
      expect(result.current.isRemoving).toBe(false);
    });

    // Verifies that removed track is restored when API call fails
    it('should rollback on API failure', async () => {
      const track1 = createMockTrack({ _id: 'track-1', title: 'Track 1' });
      const track2 = createMockTrack({ _id: 'track-2', title: 'Track 2' });
      const playlist = createMockPlaylist([track1, track2]);

      mockPlaylistsService.removeTrack.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() =>
        usePlaylistOperations({
          playlistId: 'playlist-1',
          playlist,
          setPlaylist: mockSetPlaylist,
          onError: mockOnError,
          onSuccess: mockOnSuccess,
        })
      );

      await act(async () => {
        await result.current.removeTrack('track-1');
      });

      // Verify first call was optimistic update (track removed)
      expect(mockSetPlaylist).toHaveBeenNthCalledWith(1, {
        ...playlist,
        trackIds: [track2],
      });

      // Verify second call was rollback (original tracks restored)
      expect(mockSetPlaylist).toHaveBeenNthCalledWith(2, {
        ...playlist,
        trackIds: [track1, track2],
      });

      // Verify error callback was called
      expect(mockOnError).toHaveBeenCalledWith('Failed to remove track');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});

/**
 * Test Suite: playlistsService API
 *
 * Tests the API service layer methods that handle HTTP requests.
 * Uses mocked apiService to verify correct endpoint construction and error propagation.
 *
 * @description Tests cover:
 * - reorderTracks: PATCH /playlists/:id/reorder with trackIds array
 * - addTrack: POST /playlists/:id/tracks with trackId
 * - removeTrack: DELETE /playlists/:id/tracks/:trackId
 */
describe('playlistsService API', () => {
  // Import the actual service implementation for API tests
  const actualPlaylistsService = jest.requireActual('@/shared/services/playlists.service').playlistsService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * reorderTracks API Tests
   *
   * Verifies correct PATCH request to /playlists/:id/reorder endpoint.
   */
  describe('reorderTracks', () => {
    // Verifies that the service constructs the correct API call
    it('should call apiService.patch with correct endpoint and trackIds', async () => {
      const playlistId = 'playlist-123';
      const trackIds = ['track-1', 'track-2', 'track-3'];
      const mockResponse: Playlist = {
        _id: playlistId,
        name: 'Test Playlist',
        description: 'Test description',
        ownerId: 'user-1',
        trackIds: [],
        isPublic: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await actualPlaylistsService.reorderTracks(playlistId, trackIds);

      expect(mockApiService.patch).toHaveBeenCalledWith(
        `/playlists/${playlistId}/reorder`,
        { trackIds }
      );
      expect(result).toEqual(mockResponse);
    });

    // Verifies that API errors are properly propagated to callers
    it('should propagate API errors correctly', async () => {
      const playlistId = 'playlist-123';
      const trackIds = ['track-1', 'track-2'];
      const error = new Error('Network error');

      mockApiService.patch.mockRejectedValueOnce(error);

      await expect(actualPlaylistsService.reorderTracks(playlistId, trackIds))
        .rejects.toThrow('Network error');
    });
  });

  /**
   * addTrack API Tests
   *
   * Verifies correct POST request to /playlists/:id/tracks endpoint.
   */
  describe('addTrack', () => {
    // Verifies that the service constructs the correct API call
    it('should call apiService.post with correct endpoint and trackId', async () => {
      const playlistId = 'playlist-123';
      const trackId = 'track-456';
      const mockResponse: Playlist = {
        _id: playlistId,
        name: 'Test Playlist',
        description: 'Test description',
        ownerId: 'user-1',
        trackIds: [],
        isPublic: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiService.post.mockResolvedValueOnce(mockResponse);

      const result = await actualPlaylistsService.addTrack(playlistId, trackId);

      expect(mockApiService.post).toHaveBeenCalledWith(
        `/playlists/${playlistId}/tracks`,
        { trackId }
      );
      expect(result).toEqual(mockResponse);
    });

    // Verifies that API errors are properly propagated to callers
    it('should propagate API errors correctly', async () => {
      const playlistId = 'playlist-123';
      const trackId = 'track-456';
      const error = new Error('Playlist not found');

      mockApiService.post.mockRejectedValueOnce(error);

      await expect(actualPlaylistsService.addTrack(playlistId, trackId))
        .rejects.toThrow('Playlist not found');
    });
  });

  /**
   * removeTrack API Tests
   *
   * Verifies correct DELETE request to /playlists/:id/tracks/:trackId endpoint.
   */
  describe('removeTrack', () => {
    // Verifies that the service constructs the correct API call
    it('should call apiService.delete with correct endpoint', async () => {
      const playlistId = 'playlist-123';
      const trackId = 'track-456';
      const mockResponse: Playlist = {
        _id: playlistId,
        name: 'Test Playlist',
        description: 'Test description',
        ownerId: 'user-1',
        trackIds: [],
        isPublic: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiService.delete.mockResolvedValueOnce(mockResponse);

      const result = await actualPlaylistsService.removeTrack(playlistId, trackId);

      expect(mockApiService.delete).toHaveBeenCalledWith(
        `/playlists/${playlistId}/tracks/${trackId}`
      );
      expect(result).toEqual(mockResponse);
    });

    // Verifies that API errors are properly propagated to callers
    it('should propagate API errors correctly', async () => {
      const playlistId = 'playlist-123';
      const trackId = 'track-456';
      const error = new Error('Forbidden');

      mockApiService.delete.mockRejectedValueOnce(error);

      await expect(actualPlaylistsService.removeTrack(playlistId, trackId))
        .rejects.toThrow('Forbidden');
    });
  });
});
