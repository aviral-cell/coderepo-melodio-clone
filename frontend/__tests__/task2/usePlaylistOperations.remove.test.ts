import { renderHook, act, waitFor } from '@testing-library/react';

import { usePlaylistOperations } from '@/shared/hooks/usePlaylistOperations';
import { playlistsService } from '@/shared/services/playlists.service';
import { PlaylistWithTracks } from '@/shared/types/playlist.types';
import { TrackWithPopulated } from '@/shared/types/track.types';

// Mock the playlists service
jest.mock('@/shared/services/playlists.service');

const mockPlaylistsService = playlistsService as jest.Mocked<
  typeof playlistsService
>;

// Mock track data factory
const createMockTrack = (id: string, title: string): TrackWithPopulated => ({
  _id: id,
  title,
  artistId: { _id: 'artist-1', name: 'Test Artist', imageUrl: '/artist.jpg' },
  albumId: { _id: 'album-1', title: 'Test Album', coverImageUrl: '/album.jpg' },
  durationInSeconds: 180,
  trackNumber: 1,
  genre: 'Pop',
  playCount: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

// Mock playlist data factory
const createMockPlaylist = (
  tracks: TrackWithPopulated[]
): PlaylistWithTracks => ({
  _id: 'playlist-1',
  name: 'Test Playlist',
  description: 'A test playlist',
  ownerId: 'user-1',
  trackIds: tracks,
  coverImageUrl: '/playlist.jpg',
  isPublic: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('usePlaylistOperations - removeTrack', () => {
  let mockSetPlaylist: jest.Mock;
  let mockOnSuccess: jest.Mock;
  let mockOnError: jest.Mock;
  let mockPlaylist: PlaylistWithTracks;
  let mockTracks: TrackWithPopulated[];

  beforeEach(() => {
    mockSetPlaylist = jest.fn();
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();

    mockTracks = [
      createMockTrack('track-1', 'Track 1'),
      createMockTrack('track-2', 'Track 2'),
      createMockTrack('track-3', 'Track 3'),
    ];
    mockPlaylist = createMockPlaylist(mockTracks);

    // Default mock implementation - success case
    mockPlaylistsService.removeTrack.mockResolvedValue({
      ...mockPlaylist,
      trackIds: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should remove track from playlist by trackId', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-2');
    });

    // Verify setPlaylist was called with correctly filtered tracks
    // Removing track-2 should leave [track-1, track-3]
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-1', title: 'Track 1' }),
          expect.objectContaining({ _id: 'track-3', title: 'Track 3' }),
        ],
      })
    );

    // Verify the removed track is NOT in the result
    const callArg = mockSetPlaylist.mock.calls[0][0];
    const trackIds = callArg.trackIds.map(
      (track: TrackWithPopulated) => track._id
    );
    expect(trackIds).not.toContain('track-2');
    expect(trackIds).toHaveLength(2);
  });

  it('should perform optimistic update before API call resolves', async () => {
    // Create a promise that we can control
    let resolveApiCall: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    mockPlaylistsService.removeTrack.mockReturnValue(
      apiPromise as Promise<PlaylistWithTracks>
    );

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    // Start the remove operation but don't await it
    let removePromise: Promise<void>;
    act(() => {
      removePromise = result.current.removeTrack('track-2');
    });

    // Verify optimistic update happened immediately (before API resolves)
    expect(mockSetPlaylist).toHaveBeenCalledTimes(1);
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-1' }),
          expect.objectContaining({ _id: 'track-3' }),
        ],
      })
    );

    // API should have been called
    expect(mockPlaylistsService.removeTrack).toHaveBeenCalled();

    // But onSuccess should not have been called yet
    expect(mockOnSuccess).not.toHaveBeenCalled();

    // Now resolve the API call
    await act(async () => {
      resolveApiCall!({ ...mockPlaylist, trackIds: [] });
      await removePromise!;
    });

    // Now onSuccess should have been called
    expect(mockOnSuccess).toHaveBeenCalledWith('Track removed from playlist');
  });

  it('should call playlistsService.removeTrack with correct parameters', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-2');
    });

    // Verify API was called with correct playlistId and trackId
    expect(mockPlaylistsService.removeTrack).toHaveBeenCalledWith(
      'playlist-1',
      'track-2'
    );
    expect(mockPlaylistsService.removeTrack).toHaveBeenCalledTimes(1);
  });

  it('should rollback and restore track on API failure', async () => {
    mockPlaylistsService.removeTrack.mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-2');
    });

    // setPlaylist should have been called twice:
    // 1. Optimistic update (track removed)
    // 2. Rollback (track restored)
    expect(mockSetPlaylist).toHaveBeenCalledTimes(2);

    // First call: optimistic update (track-2 removed)
    expect(mockSetPlaylist).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-1' }),
          expect.objectContaining({ _id: 'track-3' }),
        ],
      })
    );

    // Second call: rollback with all original tracks restored
    expect(mockSetPlaylist).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-1' }),
          expect.objectContaining({ _id: 'track-2' }),
          expect.objectContaining({ _id: 'track-3' }),
        ],
      })
    );

    // onError should have been called
    expect(mockOnError).toHaveBeenCalledWith('Failed to remove track');
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should set isRemoving to true during operation', async () => {
    let resolveApiCall: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    mockPlaylistsService.removeTrack.mockReturnValue(
      apiPromise as Promise<PlaylistWithTracks>
    );

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    // Initially isRemoving should be false
    expect(result.current.isRemoving).toBe(false);

    // Start the remove operation
    let removePromise: Promise<void>;
    act(() => {
      removePromise = result.current.removeTrack('track-2');
    });

    // isRemoving should be true during the operation
    await waitFor(() => {
      expect(result.current.isRemoving).toBe(true);
    });

    // Resolve the API call
    await act(async () => {
      resolveApiCall!({ ...mockPlaylist, trackIds: [] });
      await removePromise!;
    });

    // isRemoving should be false after completion
    expect(result.current.isRemoving).toBe(false);
  });

  it('should call onSuccess callback on successful removal', async () => {
    mockPlaylistsService.removeTrack.mockResolvedValue({
      ...mockPlaylist,
      trackIds: [],
    });

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-1');
    });

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith('Track removed from playlist');
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onError callback on failed removal', async () => {
    mockPlaylistsService.removeTrack.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-1');
    });

    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith('Failed to remove track');
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should not remove when playlist is null', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: null,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-1');
    });

    // No state update should happen
    expect(mockSetPlaylist).not.toHaveBeenCalled();

    // No API call should be made
    expect(mockPlaylistsService.removeTrack).not.toHaveBeenCalled();

    // No callbacks should be invoked
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should handle removing the only track in playlist', async () => {
    // Create a playlist with only one track
    const singleTrackPlaylist = createMockPlaylist([
      createMockTrack('track-only', 'Only Track'),
    ]);

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: singleTrackPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-only');
    });

    // Verify setPlaylist was called with empty trackIds array
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [],
      })
    );

    // Verify the resulting trackIds array is empty
    const callArg = mockSetPlaylist.mock.calls[0][0];
    expect(callArg.trackIds).toHaveLength(0);

    // API should still be called
    expect(mockPlaylistsService.removeTrack).toHaveBeenCalledWith(
      'playlist-1',
      'track-only'
    );

    // onSuccess should be called
    expect(mockOnSuccess).toHaveBeenCalledWith('Track removed from playlist');
  });

  it('should handle removing non-existent trackId gracefully', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('non-existent-track');
    });

    // setPlaylist should still be called (optimistic update with filter)
    expect(mockSetPlaylist).toHaveBeenCalledTimes(1);

    // The filter with !== will keep all tracks since none match
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-1' }),
          expect.objectContaining({ _id: 'track-2' }),
          expect.objectContaining({ _id: 'track-3' }),
        ],
      })
    );

    // API should still be called with the non-existent trackId
    expect(mockPlaylistsService.removeTrack).toHaveBeenCalledWith(
      'playlist-1',
      'non-existent-track'
    );

    // onSuccess should be called (API call succeeded)
    expect(mockOnSuccess).toHaveBeenCalledWith('Track removed from playlist');
  });

  it('should set isRemoving to false after API failure', async () => {
    mockPlaylistsService.removeTrack.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    expect(result.current.isRemoving).toBe(false);

    await act(async () => {
      await result.current.removeTrack('track-1');
    });

    // isRemoving should be false after error
    expect(result.current.isRemoving).toBe(false);
  });

  it('should work without optional callbacks', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        // No onSuccess or onError callbacks
      })
    );

    // Should not throw when removal succeeds
    await act(async () => {
      await result.current.removeTrack('track-2');
    });

    expect(mockSetPlaylist).toHaveBeenCalled();
    expect(mockPlaylistsService.removeTrack).toHaveBeenCalled();
  });

  it('should work without optional callbacks on error', async () => {
    mockPlaylistsService.removeTrack.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        // No onSuccess or onError callbacks
      })
    );

    // Should not throw when removal fails
    await act(async () => {
      await result.current.removeTrack('track-2');
    });

    // Rollback should still happen
    expect(mockSetPlaylist).toHaveBeenCalledTimes(2);
  });

  it('should remove first track correctly', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-1');
    });

    // Removing track-1 should leave [track-2, track-3]
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-2', title: 'Track 2' }),
          expect.objectContaining({ _id: 'track-3', title: 'Track 3' }),
        ],
      })
    );
  });

  it('should remove last track correctly', async () => {
    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.removeTrack('track-3');
    });

    // Removing track-3 should leave [track-1, track-2]
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-1', title: 'Track 1' }),
          expect.objectContaining({ _id: 'track-2', title: 'Track 2' }),
        ],
      })
    );
  });
});
