import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerProvider, usePlayer } from '../PlayerContext';
import { TrackWithPopulated } from '../../types/track.types';

const mockTrack: TrackWithPopulated = {
  _id: 'track-1',
  title: 'Test Song',
  artistId: { _id: 'artist-1', name: 'Test Artist', imageUrl: '' },
  albumId: { _id: 'album-1', title: 'Test Album', coverImageUrl: '' },
  durationInSeconds: 180,
  trackNumber: 1,
  genre: 'pop',
  playCount: 100,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function TestComponent() {
  const { state, playTrack, togglePlayPause } = usePlayer();

  return (
    <div>
      <span data-testid="is-playing">{state.isPlaying.toString()}</span>
      <span data-testid="queue-length">{state.queue.length}</span>
      <span data-testid="current-track">{state.currentTrack?.title || 'none'}</span>
      <button data-testid="play-track" onClick={() => playTrack(mockTrack)}>
        Play Track
      </button>
      <button data-testid="toggle-play-pause" onClick={togglePlayPause}>
        Toggle
      </button>
    </div>
  );
}

describe('PlayerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have initial state with empty queue and isPlaying=false', () => {
    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
    expect(screen.getByTestId('queue-length')).toHaveTextContent('0');
    expect(screen.getByTestId('current-track')).toHaveTextContent('none');
  });

  it('should set currentTrack and isPlaying=true when playTrack is called', async () => {
    const user = userEvent.setup();

    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    await user.click(screen.getByTestId('play-track'));

    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
    expect(screen.getByTestId('current-track')).toHaveTextContent('Test Song');
  });

  it('should toggle isPlaying state when togglePlayPause is called', async () => {
    const user = userEvent.setup();

    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    // First play a track
    await user.click(screen.getByTestId('play-track'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Toggle to pause
    await user.click(screen.getByTestId('toggle-play-pause'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');

    // Toggle to resume
    await user.click(screen.getByTestId('toggle-play-pause'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
  });
});
