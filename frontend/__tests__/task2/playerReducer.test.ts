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

    // Verifies that shuffle works correctly when starting from first track
    it('should enable shuffle and preserve current track at index 0 when starting from first track', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const track4 = createMockTrack('4', 'Track 4');
      const state: PlayerState = {
        ...initialState,
        currentTrack: track1,
        queue: [track1, track2, track3, track4],
        queueIndex: 0,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue[0]).toEqual(track1); // Current track stays at index 0
      expect(newState.queueIndex).toBe(0);
      expect(newState.queue).toHaveLength(4);
    });

    // Verifies that shuffle works correctly when starting from last track in queue
    it('should enable shuffle from last track and set queueIndex to 0', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const track4 = createMockTrack('4', 'Track 4');
      const track5 = createMockTrack('5', 'Track 5');
      const track6 = createMockTrack('6', 'Track 6');
      const state: PlayerState = {
        ...initialState,
        currentTrack: track6,
        queue: [track1, track2, track3, track4, track5, track6],
        queueIndex: 5, // Last track
        isPlaying: true,
      };

      // Pre-computed shuffled queue with track6 at index 0
      const preComputedQueue = [track6, track3, track1, track5, track2, track4];

      // Act
      const newState = playerReducer(state, {
        type: 'TOGGLE_SHUFFLE',
        payload: { shuffledQueue: preComputedQueue },
      });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue[0]).toEqual(track6); // Current track at index 0
      expect(newState.queueIndex).toBe(0);
      expect(newState.queue).toHaveLength(6);
    });

    // Verifies graceful handling when queue is empty
    it('should handle empty queue gracefully when enabling shuffle', () => {
      // Arrange
      const state: PlayerState = {
        ...initialState,
        currentTrack: null,
        queue: [],
        queueIndex: 0,
        isPlaying: false,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue).toEqual([]);
      expect(newState.originalQueue).toEqual([]);
    });

    // Verifies graceful handling when currentTrack is null but queue has tracks
    it('should handle no currentTrack gracefully when enabling shuffle', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const originalQueue = [track1, track2, track3];
      const state: PlayerState = {
        ...initialState,
        currentTrack: null,
        queue: originalQueue,
        queueIndex: 0,
        isPlaying: false,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.queue).toEqual(originalQueue); // Queue unchanged when no current track
      expect(newState.originalQueue).toEqual(originalQueue); // Original queue saved
    });

    // Verifies fallback behavior when originalQueue is empty during disable
    it('should fallback to current queue when originalQueue is empty on disable', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const currentQueue = [track2, track1, track3];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2,
        queue: currentQueue,
        originalQueue: [], // Empty original queue
        queueIndex: 0,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'TOGGLE_SHUFFLE' });

      // Assert
      expect(newState.shuffleEnabled).toBe(false);
      expect(newState.queue).toEqual(currentQueue); // Falls back to current queue
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

  /**
   * TOGGLE_SHUFFLE with TICK Integration Tests
   *
   * Tests the interaction between shuffle mode and TICK action.
   * Verifies that track advancement works correctly with shuffled queue order.
   */
  describe('TOGGLE_SHUFFLE with TICK integration', () => {
    // Verifies that TICK advances to the next track in shuffled queue order
    it('should advance to next shuffled track when current track ends', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1', 180);
      const track2 = createMockTrack('2', 'Track 2', 180);
      const track3 = createMockTrack('3', 'Track 3', 180);
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track3,
        queue: shuffledQueue,
        queueIndex: 0,
        isPlaying: true,
        elapsedSeconds: 179, // One second before track ends
        shuffleEnabled: true,
        repeatMode: 'off',
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.currentTrack).toEqual(track1); // Next in shuffled queue
      expect(newState.queueIndex).toBe(1);
      expect(newState.elapsedSeconds).toBe(0);
      expect(newState.isPlaying).toBe(true);
    });

    // Verifies that playback stops at end of shuffled queue with repeatMode off
    it("should stop playback at end of shuffled queue with repeatMode 'off'", () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1', 180);
      const track2 = createMockTrack('2', 'Track 2', 180);
      const track3 = createMockTrack('3', 'Track 3', 180);
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2, // Last track in shuffled queue
        queue: shuffledQueue,
        queueIndex: 2, // Last index
        isPlaying: true,
        elapsedSeconds: 179, // One second before track ends
        shuffleEnabled: true,
        repeatMode: 'off',
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.isPlaying).toBe(false);
      expect(newState.elapsedSeconds).toBe(0);
    });

    // Verifies that 'repeat all' loops back to first shuffled track
    it("should loop to first shuffled track at end of queue with repeatMode 'all'", () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1', 180);
      const track2 = createMockTrack('2', 'Track 2', 180);
      const track3 = createMockTrack('3', 'Track 3', 180);
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2, // Last track in shuffled queue
        queue: shuffledQueue,
        queueIndex: 2, // Last index
        isPlaying: true,
        elapsedSeconds: 179, // One second before track ends
        shuffleEnabled: true,
        repeatMode: 'all',
      };

      // Act
      const newState = playerReducer(state, { type: 'TICK' });

      // Assert
      expect(newState.currentTrack).toEqual(track3); // First in shuffled queue
      expect(newState.queueIndex).toBe(0);
      expect(newState.isPlaying).toBe(true);
    });

    // THE BUG SCENARIO: Verifies playback continues when shuffle is enabled from last track
    it('should continue playback when shuffle enabled from last track and track ends', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1', 180);
      const track2 = createMockTrack('2', 'Track 2', 180);
      const track3 = createMockTrack('3', 'Track 3', 180);
      const track4 = createMockTrack('4', 'Track 4', 180);
      const track5 = createMockTrack('5', 'Track 5', 180);
      const track6 = createMockTrack('6', 'Track 6', 180);
      const originalQueue = [track1, track2, track3, track4, track5, track6];

      // Step 1: PLAY_TRACKS with startIndex=5 (last track)
      let state = playerReducer(initialState, {
        type: 'PLAY_TRACKS',
        payload: { tracks: originalQueue, startIndex: 5 },
      });

      // Assert initial state after PLAY_TRACKS
      expect(state.currentTrack).toEqual(track6);
      expect(state.queueIndex).toBe(5);

      // Step 2: TOGGLE_SHUFFLE with pre-computed queue (track6 at index 0)
      const shuffledQueue = [track6, track3, track1, track5, track2, track4];
      state = playerReducer(state, {
        type: 'TOGGLE_SHUFFLE',
        payload: { shuffledQueue },
      });

      // Assert state after shuffle
      expect(state.shuffleEnabled).toBe(true);
      expect(state.queue[0]).toEqual(track6);
      expect(state.queueIndex).toBe(0);

      // Step 3: Simulate track ending (set elapsedSeconds near end, then TICK)
      state = {
        ...state,
        elapsedSeconds: 179, // One second before track6 ends
      };
      state = playerReducer(state, { type: 'TICK' });

      // Assert: Playback should continue to next shuffled track
      expect(state.isPlaying).toBe(true);
      expect(state.queueIndex).toBe(1);
      expect(state.currentTrack).toEqual(track3); // Next in shuffled queue
      expect(state.elapsedSeconds).toBe(0);
    });
  });

  /**
   * NEXT and PREVIOUS with Shuffle Tests
   *
   * Tests the NEXT and PREVIOUS actions work correctly with shuffled queue.
   * Navigation should follow the shuffled order, not the original order.
   */
  describe('NEXT and PREVIOUS with shuffle', () => {
    // Verifies that NEXT advances in shuffled queue order
    it('should advance in shuffled queue order on NEXT', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track3,
        queue: shuffledQueue,
        queueIndex: 0,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'NEXT' });

      // Assert
      expect(newState.queueIndex).toBe(1);
      expect(newState.currentTrack).toEqual(track1); // Next in shuffled order
    });

    // Verifies that PREVIOUS goes back in shuffled queue order
    it('should go back in shuffled queue order on PREVIOUS', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track2,
        queue: shuffledQueue,
        queueIndex: 2, // Last position in shuffled queue
        shuffleEnabled: true,
        elapsedSeconds: 1, // Less than 3 seconds to trigger previous track
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'PREVIOUS' });

      // Assert
      expect(newState.queueIndex).toBe(1);
      expect(newState.currentTrack).toEqual(track1); // Previous in shuffled order
    });
  });

  /**
   * Shuffle State Persistence Tests
   *
   * Tests how shuffle state is affected by various player actions.
   * Verifies shuffle is properly reset or preserved based on action type.
   */
  describe('Shuffle state persistence', () => {
    // Verifies that PLAY_TRACKS resets shuffle state
    it('should reset shuffle state on PLAY_TRACKS', () => {
      // Arrange
      const oldTrack1 = createMockTrack('old1', 'Old Track 1');
      const oldTrack2 = createMockTrack('old2', 'Old Track 2');
      const newTrack1 = createMockTrack('new1', 'New Track 1');
      const newTrack2 = createMockTrack('new2', 'New Track 2');
      const state: PlayerState = {
        ...initialState,
        currentTrack: oldTrack1,
        queue: [oldTrack2, oldTrack1], // Shuffled order
        originalQueue: [oldTrack1, oldTrack2],
        queueIndex: 1,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, {
        type: 'PLAY_TRACKS',
        payload: { tracks: [newTrack1, newTrack2], startIndex: 0 },
      });

      // Assert
      expect(newState.shuffleEnabled).toBe(false);
      expect(newState.originalQueue).toEqual([]);
      expect(newState.queue).toEqual([newTrack1, newTrack2]);
    });

    // Verifies that PLAY_TRACK preserves shuffle state when track is in queue
    it('should preserve shuffle state on PLAY_TRACK', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track3,
        queue: shuffledQueue,
        originalQueue: [track1, track2, track3],
        queueIndex: 0,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act - Play a track already in the queue
      const newState = playerReducer(state, {
        type: 'PLAY_TRACK',
        payload: track1,
      });

      // Assert
      expect(newState.shuffleEnabled).toBe(true);
      expect(newState.currentTrack).toEqual(track1);
    });

    // Verifies that ADD_TO_QUEUE appends to end of shuffled queue
    it('should append to end of shuffled queue on ADD_TO_QUEUE', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const track4 = createMockTrack('4', 'Track 4');
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track3,
        queue: shuffledQueue,
        queueIndex: 0,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, {
        type: 'ADD_TO_QUEUE',
        payload: track4,
      });

      // Assert
      expect(newState.queue).toEqual([track3, track1, track2, track4]);
      expect(newState.shuffleEnabled).toBe(true);
    });

    // Verifies that CLEAR_QUEUE should reset shuffle state
    // NOTE: This test is expected to FAIL with current implementation
    // The bug is that CLEAR_QUEUE doesn't reset shuffleEnabled and originalQueue
    it('should reset shuffle state on CLEAR_QUEUE', () => {
      // Arrange
      const track1 = createMockTrack('1', 'Track 1');
      const track2 = createMockTrack('2', 'Track 2');
      const track3 = createMockTrack('3', 'Track 3');
      const shuffledQueue = [track3, track1, track2];
      const state: PlayerState = {
        ...initialState,
        currentTrack: track3,
        queue: shuffledQueue,
        originalQueue: [track1, track2, track3],
        queueIndex: 0,
        shuffleEnabled: true,
        isPlaying: true,
      };

      // Act
      const newState = playerReducer(state, { type: 'CLEAR_QUEUE' });

      // Assert - Expected behavior (may fail with current implementation)
      expect(newState.shuffleEnabled).toBe(false);
      expect(newState.originalQueue).toEqual([]);
    });
  });
});
