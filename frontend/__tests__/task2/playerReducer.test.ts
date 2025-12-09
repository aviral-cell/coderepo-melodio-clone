/**
 * @file playerReducer.test.ts
 * @description Unit tests for the player reducer that manages music playback state.
 *
 * The player reducer handles all state transitions for the music player including
 * playback controls, queue management, shuffle/repeat modes, and progress tracking.
 *
 * @module __tests__/task2/playerReducer.test
 *
 * Test Coverage:
 * - TOGGLE_SHUFFLE: Queue randomization with current track preservation at index 0
 * - TOGGLE_REPEAT: Cycling through 'off' -> 'all' -> 'one' -> 'off'
 * - TICK: Progress tracking and auto-advance based on repeat mode
 *
 * Implementation Notes:
 * - Shuffle uses Fisher-Yates algorithm (mocked here for deterministic testing)
 * - Original queue is stored when shuffle is enabled for restoration on disable
 * - Shuffle computation moved to component level for React StrictMode compatibility
 */
import { playerReducer, initialState } from '@/shared/contexts/playerReducer';
import { PlayerState } from '@/shared/types/player.types';
import { TrackWithPopulated } from '@/shared/types/track.types';

// Mock shuffleArray to return predictable results (reverse order)
// This makes tests deterministic since Fisher-Yates shuffle is randomized
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

/**
 * Test Suite: playerReducer
 *
 * Tests the pure reducer function that manages all player state transitions.
 * Uses mocked shuffleArray for deterministic shuffle behavior in tests.
 */
describe('playerReducer', () => {
  // Clear mocks between tests to ensure isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TOGGLE_SHUFFLE Tests
   *
   * Tests the shuffle toggle functionality that randomizes queue order.
   * Key behaviors:
   * - Current track must always remain at index 0 when shuffle is enabled
   * - Original queue order is preserved for later restoration
   * - Disabling shuffle restores the original queue with correct queueIndex
   */
  describe('TOGGLE_SHUFFLE', () => {
    // Verifies that the currently playing track stays at position 0 after shuffle
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

    // Verifies that the pre-shuffle queue order is saved for later restoration
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

    // Verifies that disabling shuffle restores the original track order
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

    // Verifies that pre-computed shuffledQueue from payload is used when provided
    // This is the key behavior for React StrictMode compatibility
    it('should use pre-computed shuffledQueue from payload when provided', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const track4 = createMockTrack('4', 'Track 4');
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2,
        queue: [track1, track2, track3, track4],
        queueIndex: 1,
        isPlaying: true,
      };

      // Pre-computed shuffled queue (current track at index 0)
      const preComputedQueue = [track2, track4, track1, track3];

      // Act - Dispatch with payload containing pre-computed shuffle
      const newState = playerReducer(state, {
        type: 'TOGGLE_SHUFFLE',
        payload: { shuffledQueue: preComputedQueue },
      });

      // Assert - Should use exact pre-computed queue
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue).toEqual(preComputedQueue);
      expect(newState.queue[0]).toEqual(track2); // Current track at index 0
      expect(newState.queueIndex).toBe(0);
    });

    // Verifies that shuffle falls back to internal computation when no payload
    it('should fall back to internal shuffle when no payload provided', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const state: PlayerState = {
        ...initialState,
        currentTrack: track1,
        queue: [track1, track2, track3],
        queueIndex: 0,
        isPlaying: true,
      };

      // Act - Dispatch without payload (uses internal shuffle)
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue[0]).toEqual(track1); // Current track still at index 0
      expect(newState.queue).toHaveLength(3);
      // Mock shuffle reverses array, so [track2, track3] reversed = [track3, track2]
      expect(newState.queue).toEqual([track1, track3, track2]);
    });

    // Verifies that enabling shuffle with only 1 track doesn't modify queue
    it('should not shuffle when queue has only 1 track', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const state: PlayerState = {
        ...initialState,
        currentTrack: track1,
        queue: [track1],
        queueIndex: 0,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert - Shuffle enabled but queue unchanged
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue).toEqual([track1]);
    });

    // Verifies that queueIndex points to the correct position in restored queue
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

  /**
   * TOGGLE_REPEAT Tests
   *
   * Tests the repeat mode cycling: off -> all -> one -> off
   * - 'off': Stop after queue ends
   * - 'all': Loop entire queue when last track ends
   * - 'one': Repeat current track indefinitely
   */
  describe('TOGGLE_REPEAT', () => {
    // Verifies the complete repeat mode cycle
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

    // Verifies that cycling continues correctly after multiple toggles
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

  /**
   * TICK Tests
   *
   * Tests the timer tick action that advances playback progress.
   * TICK is dispatched every second when playing and handles:
   * - Normal progress increment
   * - Track transitions based on repeat mode
   * - Queue looping (repeat all) vs stopping (repeat off)
   */
  describe('TICK', () => {
    // Verifies that elapsed time increases by 1 second per tick
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

    // Verifies that 'repeat one' mode restarts the same track when it ends
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

    // Verifies that normal playback advances to the next track in queue
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

    // Verifies that 'repeat all' mode loops back to the first track
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
