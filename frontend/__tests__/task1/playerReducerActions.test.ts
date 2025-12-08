import { playerReducer, initialState } from '@/shared/contexts/playerReducer';
import { PlayerState, PlayerAction } from '@/shared/types/player.types';
import { TrackWithPopulated } from '@/shared/types/track.types';

const createMockTrack = (id: string, title: string, duration = 180): TrackWithPopulated => ({
  _id: id,
  title,
  artistId: { _id: 'artist-1', name: 'Test Artist', imageUrl: 'http://example.com/artist.jpg' },
  albumId: { _id: 'album-1', title: 'Test Album', coverImageUrl: 'http://example.com/album.jpg' },
  durationInSeconds: duration,
  trackNumber: 1,
  genre: 'rock',
  playCount: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('playerReducer - PLAY_TRACK', () => {
  it('should add new track to queue and play it', () => {
    const track = createMockTrack('track-1', 'Test Track');

    const action: PlayerAction = { type: 'PLAY_TRACK', payload: track };
    const newState = playerReducer(initialState, action);

    expect(newState.currentTrack).toEqual(track);
    expect(newState.queue).toContainEqual(track);
    expect(newState.isPlaying).toBe(true);
    expect(newState.elapsedSeconds).toBe(0);
  });

  it('should play existing track from queue without adding duplicate', () => {
    const track = createMockTrack('track-1', 'Test Track');

    const state: PlayerState = {
      ...initialState,
      queue: [track],
      queueIndex: 0,
      currentTrack: null,
    };

    const action: PlayerAction = { type: 'PLAY_TRACK', payload: track };
    const newState = playerReducer(state, action);

    expect(newState.queue.length).toBe(1);
    expect(newState.queueIndex).toBe(0);
  });
});

describe('playerReducer - PLAY_TRACKS', () => {
  it('should replace queue and start playing from specified index', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
    ];

    const action: PlayerAction = { type: 'PLAY_TRACKS', payload: { tracks, startIndex: 1 } };
    const newState = playerReducer(initialState, action);

    expect(newState.queue).toEqual(tracks);
    expect(newState.queueIndex).toBe(1);
    expect(newState.currentTrack?._id).toBe('track-b');
    expect(newState.isPlaying).toBe(true);
    expect(newState.elapsedSeconds).toBe(0);
  });

  it('should handle empty tracks array', () => {
    const action: PlayerAction = { type: 'PLAY_TRACKS', payload: { tracks: [], startIndex: 0 } };
    const newState = playerReducer(initialState, action);

    expect(newState.queue).toEqual([]);
    expect(newState.currentTrack).toBeNull();
  });
});

describe('playerReducer - PAUSE and RESUME', () => {
  it('should pause playback', () => {
    const state: PlayerState = {
      ...initialState,
      isPlaying: true,
    };

    const action: PlayerAction = { type: 'PAUSE' };
    const newState = playerReducer(state, action);

    expect(newState.isPlaying).toBe(false);
  });

  it('should resume playback', () => {
    const state: PlayerState = {
      ...initialState,
      isPlaying: false,
    };

    const action: PlayerAction = { type: 'RESUME' };
    const newState = playerReducer(state, action);

    expect(newState.isPlaying).toBe(true);
  });
});

describe('playerReducer - NEXT', () => {
  it('should go to next track', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
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

    expect(newState.queueIndex).toBe(1);
    expect(newState.currentTrack?._id).toBe('track-b');
    expect(newState.elapsedSeconds).toBe(0);
  });

  it('should stop playing at end of queue when repeat is off', () => {
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
      repeatMode: 'off',
    };

    const action: PlayerAction = { type: 'NEXT' };
    const newState = playerReducer(state, action);

    expect(newState.isPlaying).toBe(false);
    expect(newState.elapsedSeconds).toBe(0);
  });

  it('should loop to beginning when repeat all is enabled', () => {
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
      repeatMode: 'all',
    };

    const action: PlayerAction = { type: 'NEXT' };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(0);
    expect(newState.currentTrack?._id).toBe('track-a');
  });

  it('should return same state for empty queue', () => {
    const action: PlayerAction = { type: 'NEXT' };
    const newState = playerReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });
});

describe('playerReducer - PREVIOUS', () => {
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
      elapsedSeconds: 30,
    };

    const action: PlayerAction = { type: 'PREVIOUS' };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(1); // Same track
    expect(newState.elapsedSeconds).toBe(0); // Restarted
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
      elapsedSeconds: 2,
    };

    const action: PlayerAction = { type: 'PREVIOUS' };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(0);
    expect(newState.currentTrack?._id).toBe('track-a');
  });

  it('should stay at first track when at beginning', () => {
    const tracks = [createMockTrack('track-a', 'Track A')];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 0,
      currentTrack: tracks[0],
      elapsedSeconds: 0,
    };

    const action: PlayerAction = { type: 'PREVIOUS' };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(0);
  });
});

describe('playerReducer - SEEK', () => {
  it('should update elapsed seconds', () => {
    const track = createMockTrack('track-1', 'Test Track', 300);

    const state: PlayerState = {
      ...initialState,
      currentTrack: track,
      elapsedSeconds: 0,
    };

    const action: PlayerAction = { type: 'SEEK', payload: 120 };
    const newState = playerReducer(state, action);

    expect(newState.elapsedSeconds).toBe(120);
  });

  it('should not exceed track duration', () => {
    const track = createMockTrack('track-1', 'Test Track', 180);

    const state: PlayerState = {
      ...initialState,
      currentTrack: track,
      elapsedSeconds: 0,
    };

    const action: PlayerAction = { type: 'SEEK', payload: 300 };
    const newState = playerReducer(state, action);

    expect(newState.elapsedSeconds).toBe(180);
  });
});

describe('playerReducer - ADD_TO_QUEUE', () => {
  it('should add track to end of queue', () => {
    const track1 = createMockTrack('track-1', 'Track 1');
    const track2 = createMockTrack('track-2', 'Track 2');

    const state: PlayerState = {
      ...initialState,
      queue: [track1],
    };

    const action: PlayerAction = { type: 'ADD_TO_QUEUE', payload: track2 };
    const newState = playerReducer(state, action);

    expect(newState.queue.length).toBe(2);
    expect(newState.queue[1]._id).toBe('track-2');
  });
});

describe('playerReducer - REMOVE_FROM_QUEUE', () => {
  it('should remove track from queue', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 0,
      currentTrack: tracks[0],
    };

    const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 2 };
    const newState = playerReducer(state, action);

    expect(newState.queue.length).toBe(2);
    expect(newState.queue.find((t) => t._id === 'track-c')).toBeUndefined();
  });

  it('should adjust queueIndex when removing track before current', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 2,
      currentTrack: tracks[2],
    };

    const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 0 };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(1);
  });

  it('should clear everything when removing last track', () => {
    const track = createMockTrack('track-1', 'Track 1');

    const state: PlayerState = {
      ...initialState,
      queue: [track],
      queueIndex: 0,
      currentTrack: track,
      isPlaying: true,
    };

    const action: PlayerAction = { type: 'REMOVE_FROM_QUEUE', payload: 0 };
    const newState = playerReducer(state, action);

    expect(newState.queue).toEqual([]);
    expect(newState.currentTrack).toBeNull();
    expect(newState.isPlaying).toBe(false);
  });
});

describe('playerReducer - REORDER_QUEUE', () => {
  it('should reorder tracks in queue', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 0,
    };

    const action: PlayerAction = { type: 'REORDER_QUEUE', payload: { from: 0, to: 2 } };
    const newState = playerReducer(state, action);

    expect(newState.queue[0]._id).toBe('track-b');
    expect(newState.queue[1]._id).toBe('track-c');
    expect(newState.queue[2]._id).toBe('track-a');
  });

  it('should update queueIndex when current track is moved', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 0,
      currentTrack: tracks[0],
    };

    const action: PlayerAction = { type: 'REORDER_QUEUE', payload: { from: 0, to: 2 } };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(2);
  });
});

describe('playerReducer - CLEAR_QUEUE', () => {
  it('should clear queue but keep current track', () => {
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
    };

    const action: PlayerAction = { type: 'CLEAR_QUEUE' };
    const newState = playerReducer(state, action);

    expect(newState.queue.length).toBe(1);
    expect(newState.queue[0]._id).toBe('track-b');
    expect(newState.queueIndex).toBe(0);
  });

  it('should clear queue completely when no current track', () => {
    const tracks = [createMockTrack('track-a', 'Track A')];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      currentTrack: null,
    };

    const action: PlayerAction = { type: 'CLEAR_QUEUE' };
    const newState = playerReducer(state, action);

    expect(newState.queue).toEqual([]);
  });
});

describe('playerReducer - TOGGLE_REPEAT', () => {
  it('should cycle through repeat modes: off -> all -> one -> off', () => {
    let state: PlayerState = { ...initialState, repeatMode: 'off' };

    const action: PlayerAction = { type: 'TOGGLE_REPEAT' };

    state = playerReducer(state, action);
    expect(state.repeatMode).toBe('all');

    state = playerReducer(state, action);
    expect(state.repeatMode).toBe('one');

    state = playerReducer(state, action);
    expect(state.repeatMode).toBe('off');
  });
});

describe('playerReducer - SET_VOLUME', () => {
  it('should set volume', () => {
    const action: PlayerAction = { type: 'SET_VOLUME', payload: 50 };
    const newState = playerReducer(initialState, action);

    expect(newState.volume).toBe(50);
  });

  it('should clamp volume to minimum 0', () => {
    const action: PlayerAction = { type: 'SET_VOLUME', payload: -10 };
    const newState = playerReducer(initialState, action);

    expect(newState.volume).toBe(0);
  });

  it('should clamp volume to maximum 100', () => {
    const action: PlayerAction = { type: 'SET_VOLUME', payload: 150 };
    const newState = playerReducer(initialState, action);

    expect(newState.volume).toBe(100);
  });
});

describe('playerReducer - TICK', () => {
  it('should increment elapsed seconds', () => {
    const track = createMockTrack('track-1', 'Test Track', 300);

    const state: PlayerState = {
      ...initialState,
      currentTrack: track,
      isPlaying: true,
      elapsedSeconds: 10,
    };

    const action: PlayerAction = { type: 'TICK' };
    const newState = playerReducer(state, action);

    expect(newState.elapsedSeconds).toBe(11);
  });

  it('should not tick when paused', () => {
    const track = createMockTrack('track-1', 'Test Track', 300);

    const state: PlayerState = {
      ...initialState,
      currentTrack: track,
      isPlaying: false,
      elapsedSeconds: 10,
    };

    const action: PlayerAction = { type: 'TICK' };
    const newState = playerReducer(state, action);

    expect(newState.elapsedSeconds).toBe(10);
  });

  it('should repeat track when repeat one is enabled', () => {
    const track = createMockTrack('track-1', 'Test Track', 180);

    const state: PlayerState = {
      ...initialState,
      currentTrack: track,
      isPlaying: true,
      elapsedSeconds: 179,
      repeatMode: 'one',
    };

    const action: PlayerAction = { type: 'TICK' };
    const newState = playerReducer(state, action);

    expect(newState.elapsedSeconds).toBe(0);
  });

  it('should go to next track when track ends', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A', 180),
      createMockTrack('track-b', 'Track B', 180),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 0,
      currentTrack: tracks[0],
      isPlaying: true,
      elapsedSeconds: 179,
      repeatMode: 'off',
    };

    const action: PlayerAction = { type: 'TICK' };
    const newState = playerReducer(state, action);

    expect(newState.queueIndex).toBe(1);
    expect(newState.currentTrack?._id).toBe('track-b');
    expect(newState.elapsedSeconds).toBe(0);
  });

  it('should loop to beginning when repeat all is enabled and at end', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A', 180),
      createMockTrack('track-b', 'Track B', 180),
    ];

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

    expect(newState.queueIndex).toBe(0);
    expect(newState.currentTrack?._id).toBe('track-a');
  });

  it('should stop playback at end of queue when repeat is off', () => {
    const tracks = [createMockTrack('track-a', 'Track A', 180)];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 0,
      currentTrack: tracks[0],
      isPlaying: true,
      elapsedSeconds: 179,
      repeatMode: 'off',
    };

    const action: PlayerAction = { type: 'TICK' };
    const newState = playerReducer(state, action);

    expect(newState.isPlaying).toBe(false);
    expect(newState.elapsedSeconds).toBe(0);
  });
});

describe('playerReducer - TOGGLE_QUEUE', () => {
  it('should toggle queue panel open state', () => {
    let state = { ...initialState, isQueueOpen: false };

    const action: PlayerAction = { type: 'TOGGLE_QUEUE' };

    state = playerReducer(state, action);
    expect(state.isQueueOpen).toBe(true);

    state = playerReducer(state, action);
    expect(state.isQueueOpen).toBe(false);
  });
});

describe('playerReducer - default case', () => {
  it('should return same state for unknown action', () => {
    const state = { ...initialState };
    const action = { type: 'UNKNOWN_ACTION' } as unknown as PlayerAction;
    const newState = playerReducer(state, action);

    expect(newState).toEqual(state);
  });
});
