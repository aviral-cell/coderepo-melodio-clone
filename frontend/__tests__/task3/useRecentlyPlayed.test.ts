import { renderHook, act } from '@testing-library/react';
import { useRecentlyPlayed } from '../../src/shared/hooks/useRecentlyPlayed';
import { TrackWithPopulated } from '../../src/shared/types/track.types';

const STORAGE_KEY = 'spotify_clone_recently_played';
const MAX_RECENT_TRACKS = 10;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/**
 * Factory function to create a mock TrackWithPopulated object
 */
function createMockTrack(overrides: Partial<TrackWithPopulated> = {}): TrackWithPopulated {
  const id = overrides._id || `track-${Math.random().toString(36).substring(7)}`;
  return {
    _id: id,
    title: `Test Track ${id}`,
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

describe('useRecentlyPlayed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('addToRecentlyPlayed', () => {
    it('should add new track to beginning of list', () => {
      // Arrange
      const { result } = renderHook(() => useRecentlyPlayed());
      const newTrack = createMockTrack({ _id: 'track-new', title: 'New Track' });

      // Act
      act(() => {
        result.current.addToRecentlyPlayed(newTrack);
      });

      // Assert
      expect(result.current.recentTracks).toHaveLength(1);
      expect(result.current.recentTracks[0]._id).toBe('track-new');
      expect(result.current.recentTracks[0].title).toBe('New Track');
    });

    it('should move existing track to front (deduplication - no duplicates)', () => {
      // Arrange
      const existingTrack = createMockTrack({ _id: 'track-1', title: 'Track One' });
      const anotherTrack = createMockTrack({ _id: 'track-2', title: 'Track Two' });
      const thirdTrack = createMockTrack({ _id: 'track-3', title: 'Track Three' });

      const { result } = renderHook(() => useRecentlyPlayed());

      // Act - Add tracks in order
      act(() => {
        result.current.addToRecentlyPlayed(existingTrack);
      });
      act(() => {
        result.current.addToRecentlyPlayed(anotherTrack);
      });
      act(() => {
        result.current.addToRecentlyPlayed(thirdTrack);
      });

      // Verify initial order: [track-3, track-2, track-1]
      expect(result.current.recentTracks.map((t) => t._id)).toEqual([
        'track-3',
        'track-2',
        'track-1',
      ]);

      // Act - Re-add the first track (should move to front)
      act(() => {
        result.current.addToRecentlyPlayed(existingTrack);
      });

      // Assert - track-1 should now be at the front, no duplicates
      expect(result.current.recentTracks).toHaveLength(3);
      expect(result.current.recentTracks.map((t) => t._id)).toEqual([
        'track-1',
        'track-3',
        'track-2',
      ]);
    });

    it('should enforce MAX_RECENT_TRACKS limit (10)', () => {
      // Arrange
      const { result } = renderHook(() => useRecentlyPlayed());

      // Act - Add 12 tracks (exceeds the limit of 10)
      act(() => {
        for (let i = 1; i <= 12; i++) {
          result.current.addToRecentlyPlayed(
            createMockTrack({ _id: `track-${i}`, title: `Track ${i}` })
          );
        }
      });

      // Assert - Should only have MAX_RECENT_TRACKS (10) tracks
      expect(result.current.recentTracks).toHaveLength(MAX_RECENT_TRACKS);

      // Most recent track should be at the front
      expect(result.current.recentTracks[0]._id).toBe('track-12');

      // Oldest tracks (track-1, track-2) should be removed
      const trackIds = result.current.recentTracks.map((t) => t._id);
      expect(trackIds).not.toContain('track-1');
      expect(trackIds).not.toContain('track-2');

      // Should contain tracks 3-12
      expect(trackIds).toEqual([
        'track-12',
        'track-11',
        'track-10',
        'track-9',
        'track-8',
        'track-7',
        'track-6',
        'track-5',
        'track-4',
        'track-3',
      ]);
    });

    it('should persist to localStorage when adding track', () => {
      // Arrange
      const { result } = renderHook(() => useRecentlyPlayed());
      const newTrack = createMockTrack({ _id: 'track-persist', title: 'Persisted Track' });

      // Act
      act(() => {
        result.current.addToRecentlyPlayed(newTrack);
      });

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );

      // Verify the stored data contains the track
      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(storedData).toHaveLength(1);
      expect(storedData[0]._id).toBe('track-persist');
    });
  });

  describe('initial load', () => {
    it('should load existing tracks from localStorage on mount', () => {
      // Arrange
      const storedTracks = [
        createMockTrack({ _id: 'stored-1', title: 'Stored Track 1' }),
        createMockTrack({ _id: 'stored-2', title: 'Stored Track 2' }),
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedTracks));

      // Act
      const { result } = renderHook(() => useRecentlyPlayed());

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result.current.recentTracks).toHaveLength(2);
      expect(result.current.recentTracks[0]._id).toBe('stored-1');
      expect(result.current.recentTracks[1]._id).toBe('stored-2');
    });

    it('should handle empty localStorage gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useRecentlyPlayed());

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result.current.recentTracks).toEqual([]);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Arrange - Invalid JSON that will cause JSON.parse to throw
      localStorageMock.getItem.mockReturnValue('{ invalid json }');

      // Act - Should not throw, should handle gracefully
      const { result } = renderHook(() => useRecentlyPlayed());

      // Assert - Should have empty array (initial state) since parsing failed
      expect(result.current.recentTracks).toEqual([]);
    });
  });
});
