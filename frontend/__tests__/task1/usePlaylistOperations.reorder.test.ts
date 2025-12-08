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

// Mock track data
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

// Mock playlist data
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

describe('usePlaylistOperations - reorderTracks', () => {
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
    mockPlaylistsService.reorderTracks.mockResolvedValue({
      ...mockPlaylist,
      trackIds: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reorder tracks from index 0 to index 2', async () => {
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
      await result.current.reorderTracks(0, 2);
    });

    // Verify setPlaylist was called with correctly reordered tracks
    // Moving track from index 0 to index 2: [1,2,3] -> [2,3,1]
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-2', title: 'Track 2' }),
          expect.objectContaining({ _id: 'track-3', title: 'Track 3' }),
          expect.objectContaining({ _id: 'track-1', title: 'Track 1' }),
        ],
      })
    );
  });

  it('should perform optimistic update before API call resolves', async () => {
    // Create a promise that we can control
    let resolveApiCall: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    mockPlaylistsService.reorderTracks.mockReturnValue(
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

    // Start the reorder operation but don't await it
    let reorderPromise: Promise<void>;
    act(() => {
      reorderPromise = result.current.reorderTracks(0, 2);
    });

    // Verify optimistic update happened immediately (before API resolves)
    expect(mockSetPlaylist).toHaveBeenCalledTimes(1);
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: expect.arrayContaining([
          expect.objectContaining({ _id: 'track-2' }),
          expect.objectContaining({ _id: 'track-3' }),
          expect.objectContaining({ _id: 'track-1' }),
        ]),
      })
    );

    // API should have been called
    expect(mockPlaylistsService.reorderTracks).toHaveBeenCalled();

    // But onSuccess should not have been called yet
    expect(mockOnSuccess).not.toHaveBeenCalled();

    // Now resolve the API call
    await act(async () => {
      resolveApiCall!({ ...mockPlaylist, trackIds: [] });
      await reorderPromise!;
    });

    // Now onSuccess should have been called
    expect(mockOnSuccess).toHaveBeenCalledWith('Tracks reordered successfully');
  });

  it('should call playlistsService.reorderTracks with correct parameters', async () => {
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
      await result.current.reorderTracks(0, 2);
    });

    // Verify API was called with correct playlist ID and reordered track IDs
    expect(mockPlaylistsService.reorderTracks).toHaveBeenCalledWith(
      'playlist-1',
      ['track-2', 'track-3', 'track-1']
    );
  });

  it('should rollback to original order on API failure', async () => {
    mockPlaylistsService.reorderTracks.mockRejectedValue(
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
      await result.current.reorderTracks(0, 2);
    });

    // setPlaylist should have been called twice:
    // 1. Optimistic update (reordered)
    // 2. Rollback (original order)
    expect(mockSetPlaylist).toHaveBeenCalledTimes(2);

    // First call: optimistic update
    expect(mockSetPlaylist).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-2' }),
          expect.objectContaining({ _id: 'track-3' }),
          expect.objectContaining({ _id: 'track-1' }),
        ],
      })
    );

    // Second call: rollback to original
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
    expect(mockOnError).toHaveBeenCalledWith('Failed to reorder tracks');
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should not reorder when oldIndex equals newIndex', async () => {
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
      await result.current.reorderTracks(1, 1);
    });

    // No state update should happen
    expect(mockSetPlaylist).not.toHaveBeenCalled();

    // No API call should be made
    expect(mockPlaylistsService.reorderTracks).not.toHaveBeenCalled();

    // No callbacks should be invoked
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should set isReordering to true during operation', async () => {
    let resolveApiCall: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    mockPlaylistsService.reorderTracks.mockReturnValue(
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

    // Initially isReordering should be false
    expect(result.current.isReordering).toBe(false);

    // Start the reorder operation
    let reorderPromise: Promise<void>;
    act(() => {
      reorderPromise = result.current.reorderTracks(0, 2);
    });

    // isReordering should be true during the operation
    await waitFor(() => {
      expect(result.current.isReordering).toBe(true);
    });

    // Resolve the API call
    await act(async () => {
      resolveApiCall!({ ...mockPlaylist, trackIds: [] });
      await reorderPromise!;
    });

    // isReordering should be false after completion
    expect(result.current.isReordering).toBe(false);
  });

  it('should call onSuccess callback on successful reorder', async () => {
    mockPlaylistsService.reorderTracks.mockResolvedValue({
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
      await result.current.reorderTracks(0, 2);
    });

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith('Tracks reordered successfully');
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onError callback on failed reorder', async () => {
    mockPlaylistsService.reorderTracks.mockRejectedValue(
      new Error('API Error')
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
      await result.current.reorderTracks(0, 2);
    });

    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith('Failed to reorder tracks');
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should not reorder when playlist is null', async () => {
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
      await result.current.reorderTracks(0, 2);
    });

    expect(mockSetPlaylist).not.toHaveBeenCalled();
    expect(mockPlaylistsService.reorderTracks).not.toHaveBeenCalled();
  });

  it('should handle reorder from higher to lower index correctly', async () => {
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
      await result.current.reorderTracks(2, 0);
    });

    // Moving track from index 2 to index 0: [1,2,3] -> [3,1,2]
    expect(mockSetPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        trackIds: [
          expect.objectContaining({ _id: 'track-3', title: 'Track 3' }),
          expect.objectContaining({ _id: 'track-1', title: 'Track 1' }),
          expect.objectContaining({ _id: 'track-2', title: 'Track 2' }),
        ],
      })
    );

    expect(mockPlaylistsService.reorderTracks).toHaveBeenCalledWith(
      'playlist-1',
      ['track-3', 'track-1', 'track-2']
    );
  });

  it('should set isReordering to false after API failure', async () => {
    mockPlaylistsService.reorderTracks.mockRejectedValue(
      new Error('API Error')
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

    expect(result.current.isReordering).toBe(false);

    await act(async () => {
      await result.current.reorderTracks(0, 2);
    });

    // isReordering should be false after error
    expect(result.current.isReordering).toBe(false);
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

    // Should not throw when reordering succeeds
    await act(async () => {
      await result.current.reorderTracks(0, 2);
    });

    expect(mockSetPlaylist).toHaveBeenCalled();
    expect(mockPlaylistsService.reorderTracks).toHaveBeenCalled();
  });

  it('should work without optional callbacks on error', async () => {
    mockPlaylistsService.reorderTracks.mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() =>
      usePlaylistOperations({
        playlistId: 'playlist-1',
        playlist: mockPlaylist,
        setPlaylist: mockSetPlaylist,
        // No onSuccess or onError callbacks
      })
    );

    // Should not throw when reordering fails
    await act(async () => {
      await result.current.reorderTracks(0, 2);
    });

    // Rollback should still happen
    expect(mockSetPlaylist).toHaveBeenCalledTimes(2);
  });
});
