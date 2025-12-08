import { playerReducer, initialState } from '@/shared/contexts/playerReducer';
import { PlayerState } from '@/shared/types/player.types';
import { TrackWithPopulated } from '@/shared/types/track.types';

// Mock shuffleArray to return predictable results (reverse order)
jest.mock('@/shared/utils/playerUtils', () => ({
  shuffleArray: jest.fn((arr: unknown[]) => [...arr].reverse()),
}));

/**
 * Factory function to create mock tracks with populated artist and album data.
 * @param id - Unique identifier for the track
 * @param title - Track title
 * @param durationInSeconds - Duration of the track in seconds (default: 180)
 * @returns A TrackWithPopulated object
 */
function createMockTrack(
  id: string,
  title: string,
  durationInSeconds = 180
): TrackWithPopulated {
  return {
    _id: id,
    title,
    artistId: { _id: `artist-${id}`, name: `Artist ${id}`, imageUrl: '/artist.jpg' },
    albumId: { _id: `album-${id}`, title: `Album ${id}`, coverImageUrl: '/cover.jpg' },
    durationInSeconds,
    trackNumber: 1,
    genre: 'Pop',
    playCount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('playerReducer', () => {
  // Clear mocks between tests to ensure isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TOGGLE_SHUFFLE', () => {
    it('should enable shuffle and preserve current track at index 0', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2,
        queue: [track1, track2, track3],
        queueIndex: 1,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue[0]).toEqual(track2); // Current track should be at index 0
      expect(newState.queueIndex).toBe(0);
      expect(newState.currentTrack).toEqual(track2);
    });

    it('should store original queue when enabling shuffle', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const originalQueue = [track1, track2, track3];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track1,
        queue: originalQueue,
        queueIndex: 0,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.originalQueue).toEqual(originalQueue);
      expect(newState.originalQueue).toHaveLength(3);
    });

    it('should restore original queue order when disabling shuffle', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const originalQueue = [track1, track2, track3];
      const shuffledQueue = [track2, track3, track1]; // Simulated shuffled order
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2,
        queue: shuffledQueue,
        originalQueue,
        queueIndex: 0,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(false);
      expect(newState.queue).toEqual(originalQueue);
      expect(newState.originalQueue).toEqual([]); // Original queue should be cleared
    });

    it('should update queueIndex to match currentTrack position after unshuffle', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const originalQueue = [track1, track2, track3];
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track3, // Currently playing track3
        queue: shuffledQueue,
        originalQueue,
        queueIndex: 0, // track3 is at index 0 in shuffled queue
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(false);
      expect(newState.queue).toEqual(originalQueue);
      // track3 is at index 2 in original queue
      expect(newState.queueIndex).toBe(2);
      expect(newState.currentTrack).toEqual(track3);
    });
  });

  describe('TOGGLE_REPEAT', () => {
    it("should cycle repeat mode from 'off' to 'all' to 'one' to 'off'", () => {
      // Arrange
      const stateOff: PlayerState = {
        ...initialState,
        repeatMode: 'off',
      };

      // Act & Assert - off -> all
      const stateAll = playerReducer(stateOff, { type: 'TOGGLE_REPEAT' });
      expect(stateAll.repeatMode).toBe('all');

      // Act & Assert - all -> one
      const stateOne = playerReducer(stateAll, { type: 'TOGGLE_REPEAT' });
      expect(stateOne.repeatMode).toBe('one');

      // Act & Assert - one -> off
      const stateBackToOff = playerReducer(stateOne, { type: 'TOGGLE_REPEAT' });
      expect(stateBackToOff.repeatMode).toBe('off');
    });

    it('should handle repeat mode cycling correctly through all modes', () => {
      // Arrange
      const expectedCycle = ['off', 'all', 'one', 'off', 'all', 'one'] as const;
      let currentState: PlayerState = { ...initialState, repeatMode: 'off' };

      // Act & Assert - Verify each transition in the cycle
      for (let i = 1; i < expectedCycle.length; i++) {
        currentState = playerReducer(currentState, { type: 'TOGGLE_REPEAT' });
        expect(currentState.repeatMode).toBe(expectedCycle[i]);
      }
    });
  });

  describe('TICK', () => {
    it('should increment elapsedSeconds when playing', () => {
      // Arrange
      const track = createMockTrack('1', 'Track 1', 180);
      const state: PlayerState = {
        ...initialState,
        currentTrack: track,
        queue: [track],
        queueIndex: 0,
        isPlaying: true,
        elapsedSeconds: 10,
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.elapsedSeconds).toBe(11);
      expect(newState.isPlaying).toBe(true);
    });

    it("should restart track when repeatMode is 'one' and track ends", () => {
      // Arrange
      const track = createMockTrack('1', 'Track 1', 180);
      const state: PlayerState = {
        ...initialState,
        currentTrack: track,
        queue: [track],
        queueIndex: 0,
        isPlaying: true,
        elapsedSeconds: 179, // One second before track ends
        repeatMode: 'one',
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.elapsedSeconds).toBe(0); // Track should restart
      expect(newState.isPlaying).toBe(true);
      expect(newState.currentTrack).toEqual(track); // Same track
      expect(newState.queueIndex).toBe(0);
    });

    it("should advance to next track when current track ends with repeatMode 'off'", () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1', 180);
      const track2 = createMockTrack('2', 'Track 2', 200);
      const state: PlayerState = {
        ...initialState,
        currentTrack: track1,
        queue: [track1, track2],
        queueIndex: 0,
        isPlaying: true,
        elapsedSeconds: 179, // One second before track1 ends
        repeatMode: 'off',
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.currentTrack).toEqual(track2);
      expect(newState.queueIndex).toBe(1);
      expect(newState.elapsedSeconds).toBe(0);
      expect(newState.isPlaying).toBe(true);
    });

    it("should loop to first track when repeatMode is 'all' and queue ends", () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1', 180);
      const track2 = createMockTrack('2', 'Track 2', 200);
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2,
        queue: [track1, track2],
        queueIndex: 1, // Last track in queue
        isPlaying: true,
        elapsedSeconds: 199, // One second before track2 ends
        repeatMode: 'all',
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.currentTrack).toEqual(track1); // Should loop to first track
      expect(newState.queueIndex).toBe(0);
      expect(newState.elapsedSeconds).toBe(0);
      expect(newState.isPlaying).toBe(true);
    });
  });
});
