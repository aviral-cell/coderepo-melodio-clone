import { playerReducer, initialState } from '../PlayerContext';
import { PlayerState, PlayerAction } from '../../types/player.types';
import { TrackWithPopulated } from '../../types/track.types';

/**
 * Helper function to create mock tracks for testing.
 * Each track has a 180-second duration by default.
 */
const createMockTrack = (id: string, title: string): TrackWithPopulated => ({
  _id: id,
  title,
  artistId: { _id: 'artist-1', name: 'Test Artist', imageUrl: 'http://example.com/artist.jpg' },
  albumId: { _id: 'album-1', title: 'Test Album', coverImageUrl: 'http://example.com/album.jpg' },
  durationInSeconds: 180,
  trackNumber: 1,
  genre: 'rock',
  playCount: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('playerReducer', () => {
  /**
   * ============================================================================
   * BUG B: SHUFFLE TOGGLE - Current Track Preservation
   * ============================================================================
   *
   * EXPECTED BEHAVIOR:
   * When shuffle is enabled/disabled, the currently playing track should NOT change.
   * The user should continue hearing the same song at the same position.
   *
   * WHAT THE BUG LOOKS LIKE:
   * - User is listening to "Track C" at 45 seconds
   * - User clicks shuffle button
   * - Instead of continuing "Track C", a different track starts playing
   *
   * WHERE TO LOOK: PlayerContext.tsx -> TOGGLE_SHUFFLE case in playerReducer
   *
   * HINT: When enabling shuffle, the current track should be moved to the
   * front of the shuffled queue. When disabling, find the current track's
   * position in the original queue.
   * ============================================================================
   */
  describe('TOGGLE_SHUFFLE - Bug B: Shuffle should preserve current track', () => {
    it('should preserve currentTrack when enabling shuffle - the same track should continue playing', () => {
      // SCENARIO: User has a queue [A, B, C, D, E] with Track C currently playing
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
        createMockTrack('track-d', 'Track D'),
        createMockTrack('track-e', 'Track E'),
      ];

      // Track C is playing at index 2, 45 seconds into the song
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 2,
        currentTrack: tracks[2],
        isPlaying: true,
        elapsedSeconds: 45,
      };

      // User clicks the shuffle button
      const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
      const newState = playerReducer(state, action);

      // EXPECTED: Track C should STILL be the current track after shuffle is enabled
      // The track object should be identical (same reference or same _id)
      expect(newState.currentTrack).toEqual(tracks[2]);
      expect(newState.currentTrack?._id).toBe('track-c');
      expect(newState.shuffleEnabled).toBe(true);
    });

    it('should preserve elapsed time when enabling shuffle - playback position must not reset', () => {
      // SCENARIO: User is 60 seconds into Track B and clicks shuffle
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 60, // User is 60 seconds into the track
      };

      const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
      const newState = playerReducer(state, action);

      // EXPECTED: Elapsed time should remain at 60 seconds
      // The user should NOT hear the track restart from the beginning
      expect(newState.elapsedSeconds).toBe(60);
      expect(newState.currentTrack?._id).toBe('track-b');
    });

    it('should restore original order and find current track position when disabling shuffle', () => {
      // SCENARIO: Shuffle is ON, queue is shuffled [C, A, B], user disables shuffle
      // Track C is currently playing at shuffled index 0
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: [tracks[2], tracks[0], tracks[1]], // Shuffled order: C, A, B
        originalQueue: [...tracks], // Original order: A, B, C
        queueIndex: 0, // Currently at index 0 in shuffled queue (Track C)
        currentTrack: tracks[2],
        shuffleEnabled: true,
        isPlaying: true,
        elapsedSeconds: 30,
      };

      // User clicks shuffle button to disable it
      const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
      const newState = playerReducer(state, action);

      // EXPECTED: Queue should be restored to original order [A, B, C]
      expect(newState.queue).toEqual(tracks);

      // EXPECTED: Current track should STILL be Track C
      expect(newState.currentTrack?._id).toBe('track-c');

      // EXPECTED: queueIndex should point to Track C in ORIGINAL queue (index 2)
      // NOT stay at index 0 where Track A now is
      expect(newState.queueIndex).toBe(2);
      expect(newState.shuffleEnabled).toBe(false);
    });
  });

  /**
   * ============================================================================
   * BUG F: QUEUE INDEX ADJUSTMENT - Track Removal Index Handling
   * ============================================================================
   *
   * EXPECTED BEHAVIOR:
   * When a track is removed from the queue BEFORE the currently playing track,
   * the queueIndex must be decremented to continue pointing to the same track.
   *
   * WHAT THE BUG LOOKS LIKE:
   * - Queue: [A, B, C, D, E] with C playing (index 2)
   * - User removes Track A (index 0)
   * - Queue becomes [B, C, D, E]
   * - Bug: queueIndex stays at 2, which now points to Track D instead of Track C
   * - Result: Next track plays incorrectly, or player jumps to wrong track
   *
   * WHERE TO LOOK: PlayerContext.tsx -> REMOVE_FROM_QUEUE case in playerReducer
   *
   * HINT: Check if the removed track's index is less than queueIndex.
   * If so, decrement queueIndex by 1.
   * ============================================================================
   */
  describe('REMOVE_FROM_QUEUE - Bug F: Queue index adjustment', () => {
    it('should decrement queueIndex when a track BEFORE the current is removed', () => {
      // SCENARIO: Queue [A, B, C, D, E], Track C is playing (index 2)
      // User removes Track A (index 0) from the queue
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
        createMockTrack('track-d', 'Track D'),
        createMockTrack('track-e', 'Track E'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 2, // Track C is at index 2
        currentTrack: tracks[2],
        isPlaying: true,
      };

      // Remove Track A which is BEFORE the current track
      const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 0 };
      const newState = playerReducer(state, action);

      // Queue should now be [B, C, D, E] (4 tracks)
      expect(newState.queue).toHaveLength(4);
      expect(newState.queue[0]._id).toBe('track-b');

      // CRITICAL: Current track should STILL be Track C
      expect(newState.currentTrack?._id).toBe('track-c');

      // EXPECTED: queueIndex should be DECREMENTED from 2 to 1
      // Because Track C shifted from index 2 to index 1 after removing Track A
      expect(newState.queueIndex).toBe(1);
    });

    it('should NOT change queueIndex when a track AFTER the current is removed', () => {
      // SCENARIO: Queue [A, B, C, D], Track B is playing (index 1)
      // User removes Track D (index 3) from the queue
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
        createMockTrack('track-d', 'Track D'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1, // Track B is at index 1
        currentTrack: tracks[1],
        isPlaying: true,
      };

      // Remove Track D which is AFTER the current track
      const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 3 };
      const newState = playerReducer(state, action);

      // Queue should now be [A, B, C] (3 tracks)
      expect(newState.queue).toHaveLength(3);

      // Current track should still be Track B
      expect(newState.currentTrack?._id).toBe('track-b');

      // EXPECTED: queueIndex should REMAIN at 1 (no change needed)
      // Track B is still at index 1, nothing before it changed
      expect(newState.queueIndex).toBe(1);
    });

    it('should advance to next track when current track is removed', () => {
      // SCENARIO: Queue [A, B, C], Track B is playing (index 1)
      // User removes Track B (the currently playing track)
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
      };

      // Remove the currently playing track (Track B at index 1)
      const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 1 };
      const newState = playerReducer(state, action);

      // Queue should now be [A, C] (2 tracks)
      expect(newState.queue).toHaveLength(2);

      // EXPECTED: Current track should advance to Track C
      // (the track that was after Track B, now at index 1)
      expect(newState.currentTrack?._id).toBe('track-c');
      expect(newState.queueIndex).toBe(1);
    });
  });

  /**
   * ============================================================================
   * BUG G: TIMER BEHAVIOR - Playback Time Tracking
   * ============================================================================
   *
   * EXPECTED BEHAVIOR:
   * The TICK action should increment elapsedSeconds by exactly 1 each second
   * when the player is playing. It should handle track transitions correctly.
   *
   * NOTE: Bug G is actually about interval cleanup in useEffect, which is
   * tested separately. These tests verify the TICK reducer logic works correctly.
   *
   * WHERE TO LOOK: PlayerContext.tsx -> TICK case in playerReducer and
   *                PlayerProvider useEffect for interval management
   * ============================================================================
   */
  describe('TICK - Bug G: Timer behavior', () => {
    it('should increment elapsed time by exactly 1 second each tick when playing', () => {
      const track = createMockTrack('track-a', 'Track A');
      const state: PlayerState = {
        ...initialState,
        queue: [track],
        queueIndex: 0,
        currentTrack: track,
        isPlaying: true,
        elapsedSeconds: 10,
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // EXPECTED: Should increment by exactly 1 (not 0, not 2, not any other value)
      expect(newState.elapsedSeconds).toBe(11);
    });

    it('should NOT increment elapsed time when paused', () => {
      const track = createMockTrack('track-a', 'Track A');
      const state: PlayerState = {
        ...initialState,
        queue: [track],
        queueIndex: 0,
        currentTrack: track,
        isPlaying: false, // PAUSED
        elapsedSeconds: 10,
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // EXPECTED: Time should NOT change when paused
      expect(newState.elapsedSeconds).toBe(10);
    });

    it('should auto-advance to next track when current track ends', () => {
      // SCENARIO: Track A is at 179 seconds (1 second before end of 180-second track)
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 0,
        currentTrack: tracks[0],
        isPlaying: true,
        elapsedSeconds: 179, // Track is 180 seconds, so this is the last second
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // EXPECTED: Should auto-advance to Track B
      expect(newState.currentTrack?._id).toBe('track-b');
      expect(newState.queueIndex).toBe(1);
      expect(newState.elapsedSeconds).toBe(0); // Reset for new track
    });

    it('should reset elapsed to 0 and repeat same track when repeat-one is enabled', () => {
      const track = createMockTrack('track-a', 'Track A');
      const state: PlayerState = {
        ...initialState,
        queue: [track],
        queueIndex: 0,
        currentTrack: track,
        isPlaying: true,
        elapsedSeconds: 179, // 1 second before end
        repeatMode: 'one', // Repeat single track
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // EXPECTED: Same track should restart from 0
      expect(newState.currentTrack?._id).toBe('track-a');
      expect(newState.elapsedSeconds).toBe(0);
      expect(newState.isPlaying).toBe(true);
    });

    it('should wrap around to first track when repeat-all is enabled and queue ends', () => {
      // SCENARIO: Last track (Track B) is about to end with repeat-all enabled
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1, // Last track
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 179,
        repeatMode: 'all', // Repeat entire queue
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // EXPECTED: Should wrap back to Track A (first track)
      expect(newState.currentTrack?._id).toBe('track-a');
      expect(newState.queueIndex).toBe(0);
      expect(newState.elapsedSeconds).toBe(0);
    });

    it('should stop playing when queue ends with repeat off', () => {
      // SCENARIO: Last track is about to end with no repeat
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1, // Last track
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 179,
        repeatMode: 'off', // No repeat
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // EXPECTED: Should stop playing (not advance, not repeat)
      expect(newState.isPlaying).toBe(false);
      expect(newState.elapsedSeconds).toBe(0);
    });
  });

  /**
   * ============================================================================
   * ADDITIONAL TESTS - Core Player Functionality (No bugs in these)
   * ============================================================================
   * These tests verify that other player actions work correctly.
   * They are included for completeness and to ensure the solution is complete.
   * ============================================================================
   */
  describe('PLAY_TRACKS', () => {
    it('should set queue and start playing from specified index', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
      ];

      const state = initialState;
      const action: PlayerAction = {
        type: 'PLAY_TRACKS',
        payload: { tracks, startIndex: 1 },
      };

      const newState = playerReducer(state, action);

      expect(newState.queue).toEqual(tracks);
      expect(newState.queueIndex).toBe(1);
      expect(newState.currentTrack?._id).toBe('track-b');
      expect(newState.isPlaying).toBe(true);
      expect(newState.elapsedSeconds).toBe(0);
    });
  });

  describe('NEXT', () => {
    it('should advance to next track', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 0,
        currentTrack: tracks[0],
        isPlaying: true,
      };

      const action: PlayerAction = { type: 'NEXT' };
      const newState = playerReducer(state, action);

      expect(newState.currentTrack?._id).toBe('track-b');
      expect(newState.queueIndex).toBe(1);
      expect(newState.elapsedSeconds).toBe(0);
    });
  });

  describe('PREVIOUS', () => {
    it('should restart current track if elapsed > 3 seconds', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 10, // More than 3 seconds into the track
      };

      const action: PlayerAction = { type: 'PREVIOUS' };
      const newState = playerReducer(state, action);

      // Should restart current track (not go to previous)
      expect(newState.currentTrack?._id).toBe('track-b');
      expect(newState.queueIndex).toBe(1);
      expect(newState.elapsedSeconds).toBe(0);
    });

    it('should go to previous track if elapsed <= 3 seconds', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 2, // Less than 3 seconds into the track
      };

      const action: PlayerAction = { type: 'PREVIOUS' };
      const newState = playerReducer(state, action);

      // Should go to previous track
      expect(newState.currentTrack?._id).toBe('track-a');
      expect(newState.queueIndex).toBe(0);
      expect(newState.elapsedSeconds).toBe(0);
    });
  });
});
