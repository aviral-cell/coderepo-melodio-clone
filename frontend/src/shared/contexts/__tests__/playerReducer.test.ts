import { playerReducer, initialState } from '../PlayerContext';
import { PlayerState, PlayerAction } from '../../types/player.types';
import { TrackWithPopulated } from '../../types/track.types';

// Helper function to create mock tracks
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
  describe('TOGGLE_SHUFFLE - Bug B: Shuffle should preserve current track', () => {
    it('should preserve currentTrack when enabling shuffle', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
        createMockTrack('track-d', 'Track D'),
        createMockTrack('track-e', 'Track E'),
      ];

      // Set up state with Track C playing (index 2)
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 2,
        currentTrack: tracks[2],
        isPlaying: true,
        elapsedSeconds: 45, // Mid-track
      };

      const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
      const newState = playerReducer(state, action);

      // The current track should remain the same after enabling shuffle
      expect(newState.currentTrack).toEqual(tracks[2]);
      expect(newState.currentTrack?._id).toBe('track-c');
      expect(newState.shuffleEnabled).toBe(true);
    });

    it('should preserve elapsed time when enabling shuffle', () => {
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
        elapsedSeconds: 60,
      };

      const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
      const newState = playerReducer(state, action);

      // Elapsed time should not change when toggling shuffle
      expect(newState.elapsedSeconds).toBe(60);
      expect(newState.currentTrack?._id).toBe('track-b');
    });

    it('should restore original order and find current track position when disabling shuffle', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
      ];

      // State with shuffle enabled, Track C is current at index 0 in shuffled queue
      const state: PlayerState = {
        ...initialState,
        queue: [tracks[2], tracks[0], tracks[1]], // Shuffled: C, A, B
        originalQueue: [...tracks], // Original: A, B, C
        queueIndex: 0,
        currentTrack: tracks[2],
        shuffleEnabled: true,
        isPlaying: true,
        elapsedSeconds: 30,
      };

      const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
      const newState = playerReducer(state, action);

      // Should restore original order
      expect(newState.queue).toEqual(tracks);
      // Current track should still be Track C
      expect(newState.currentTrack?._id).toBe('track-c');
      // Index should point to Track C in original queue (index 2)
      expect(newState.queueIndex).toBe(2);
      expect(newState.shuffleEnabled).toBe(false);
    });
  });

  describe('REMOVE_FROM_QUEUE - Bug F: Queue index adjustment', () => {
    it('should decrement queueIndex when a track BEFORE the current is removed', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
        createMockTrack('track-d', 'Track D'),
        createMockTrack('track-e', 'Track E'),
      ];

      // Track C is playing (index 2)
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 2,
        currentTrack: tracks[2],
        isPlaying: true,
      };

      // Remove Track A (index 0)
      const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 0 };
      const newState = playerReducer(state, action);

      // Queue should now be [B, C, D, E]
      expect(newState.queue).toHaveLength(4);
      expect(newState.queue[0]._id).toBe('track-b');

      // Current track should still be Track C
      expect(newState.currentTrack?._id).toBe('track-c');

      // Index should be decremented from 2 to 1 (C is now at index 1)
      expect(newState.queueIndex).toBe(1);
    });

    it('should not change queueIndex when a track AFTER the current is removed', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
        createMockTrack('track-d', 'Track D'),
      ];

      // Track B is playing (index 1)
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
      };

      // Remove Track D (index 3)
      const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 3 };
      const newState = playerReducer(state, action);

      // Queue should now be [A, B, C]
      expect(newState.queue).toHaveLength(3);

      // Current track should still be Track B
      expect(newState.currentTrack?._id).toBe('track-b');

      // Index should remain 1
      expect(newState.queueIndex).toBe(1);
    });

    it('should advance to next track when current track is removed', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
        createMockTrack('track-c', 'Track C'),
      ];

      // Track B is playing (index 1)
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
      };

      // Remove Track B (current track, index 1)
      const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 1 };
      const newState = playerReducer(state, action);

      // Queue should now be [A, C]
      expect(newState.queue).toHaveLength(2);

      // Current track should now be Track C (was at index 2, now at index 1)
      expect(newState.currentTrack?._id).toBe('track-c');
      expect(newState.queueIndex).toBe(1);
    });
  });

  describe('TICK - Bug G: Timer behavior', () => {
    it('should increment elapsed time by 1 each tick when playing', () => {
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

      // Should increment by exactly 1
      expect(newState.elapsedSeconds).toBe(11);
    });

    it('should not increment elapsed time when paused', () => {
      const track = createMockTrack('track-a', 'Track A');
      const state: PlayerState = {
        ...initialState,
        queue: [track],
        queueIndex: 0,
        currentTrack: track,
        isPlaying: false,
        elapsedSeconds: 10,
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // Should not change
      expect(newState.elapsedSeconds).toBe(10);
    });

    it('should auto-advance to next track when current track ends', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      // Track A at 179 seconds (1 second before end of 180 second track)
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 0,
        currentTrack: tracks[0],
        isPlaying: true,
        elapsedSeconds: 179,
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // Should auto-advance to Track B
      expect(newState.currentTrack?._id).toBe('track-b');
      expect(newState.queueIndex).toBe(1);
      expect(newState.elapsedSeconds).toBe(0);
    });

    it('should reset elapsed to 0 when repeat-one is enabled and track ends', () => {
      const track = createMockTrack('track-a', 'Track A');
      const state: PlayerState = {
        ...initialState,
        queue: [track],
        queueIndex: 0,
        currentTrack: track,
        isPlaying: true,
        elapsedSeconds: 179, // 1 second before end
        repeatMode: 'one',
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // Should reset to 0 and keep same track
      expect(newState.currentTrack?._id).toBe('track-a');
      expect(newState.elapsedSeconds).toBe(0);
      expect(newState.isPlaying).toBe(true);
    });

    it('should wrap around to first track when repeat-all is enabled and queue ends', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      // Track B (last track) at 179 seconds
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 179,
        repeatMode: 'all',
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // Should wrap to Track A
      expect(newState.currentTrack?._id).toBe('track-a');
      expect(newState.queueIndex).toBe(0);
      expect(newState.elapsedSeconds).toBe(0);
    });

    it('should stop playing when queue ends with repeat off', () => {
      const tracks = [
        createMockTrack('track-a', 'Track A'),
        createMockTrack('track-b', 'Track B'),
      ];

      // Track B (last track) at 179 seconds
      const state: PlayerState = {
        ...initialState,
        queue: tracks,
        queueIndex: 1,
        currentTrack: tracks[1],
        isPlaying: true,
        elapsedSeconds: 179,
        repeatMode: 'off',
      };

      const action: PlayerAction = { type: 'TICK' };
      const newState = playerReducer(state, action);

      // Should stop playing
      expect(newState.isPlaying).toBe(false);
      expect(newState.elapsedSeconds).toBe(0);
    });
  });

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
        elapsedSeconds: 10, // More than 3 seconds
      };

      const action: PlayerAction = { type: 'PREVIOUS' };
      const newState = playerReducer(state, action);

      // Should restart current track
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
        elapsedSeconds: 2, // Less than 3 seconds
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
