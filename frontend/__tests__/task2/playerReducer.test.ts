import { playerReducer, initialState } from '@/shared/contexts/playerReducer';
import { PlayerState, PlayerAction } from '@/shared/types/player.types';
import { TrackWithPopulated } from '@/shared/types/track.types';

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

describe('playerReducer - TOGGLE_SHUFFLE', () => {
  it('should preserve currentTrack when enabling shuffle - the same track should continue playing', () => {
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
      queueIndex: 2,
      currentTrack: tracks[2],
      isPlaying: true,
      elapsedSeconds: 45,
    };

    const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
    const newState = playerReducer(state, action);

    expect(newState.currentTrack).toEqual(tracks[2]);
    expect(newState.currentTrack?._id).toBe('track-c');
    expect(newState.shuffleEnabled).toBe(true);
  });

  it('should preserve elapsed time when enabling shuffle - playback position must not reset', () => {
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

    expect(newState.elapsedSeconds).toBe(60);
    expect(newState.currentTrack?._id).toBe('track-b');
  });

  it('should restore original order and find current track position when disabling shuffle', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: [tracks[2], tracks[0], tracks[1]],
      originalQueue: [...tracks],
      queueIndex: 0,
      currentTrack: tracks[2],
      shuffleEnabled: true,
      isPlaying: true,
      elapsedSeconds: 30,
    };

    const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
    const newState = playerReducer(state, action);

    expect(newState.queue).toEqual(tracks);
    expect(newState.currentTrack?._id).toBe('track-c');
    expect(newState.queueIndex).toBe(2);
    expect(newState.shuffleEnabled).toBe(false);
  });

  it('should move current track to front of shuffled queue when enabling shuffle', () => {
    const tracks = [
      createMockTrack('track-a', 'Track A'),
      createMockTrack('track-b', 'Track B'),
      createMockTrack('track-c', 'Track C'),
      createMockTrack('track-d', 'Track D'),
    ];

    const state: PlayerState = {
      ...initialState,
      queue: tracks,
      queueIndex: 2,
      currentTrack: tracks[2],
      isPlaying: true,
      elapsedSeconds: 0,
    };

    const action: PlayerAction = { type: 'TOGGLE_SHUFFLE' };
    const newState = playerReducer(state, action);

    expect(newState.queue[0]._id).toBe('track-c');
    expect(newState.queueIndex).toBe(0);
    expect(newState.currentTrack?._id).toBe('track-c');
  });
});
