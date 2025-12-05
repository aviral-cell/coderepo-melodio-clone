import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerProvider, usePlayer } from '@/shared/contexts/PlayerContext';
import { TrackWithPopulated } from '@/shared/types/track.types';

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
      <span data-testid="elapsed-seconds">{state.elapsedSeconds}</span>
      <button data-testid="play-track" onClick={() => playTrack(mockTrack)}>
        Play Track
      </button>
      <button data-testid="toggle-play-pause" onClick={togglePlayPause}>
        Toggle
      </button>
    </div>
  );
}

describe('PlayerContext - Timer Interval Cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should cleanup interval when pausing - elapsed time should increment correctly after pause/resume', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    await user.click(screen.getByTestId('play-track'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('0');

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('2');

    await user.click(screen.getByTestId('toggle-play-pause'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');

    await user.click(screen.getByTestId('toggle-play-pause'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('4');
  });

  it('should not increment elapsed time when paused', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    await user.click(screen.getByTestId('play-track'));

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('3');

    await user.click(screen.getByTestId('toggle-play-pause'));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('3');
  });

  it('should have only one interval running after multiple pause/resume cycles', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    await user.click(screen.getByTestId('play-track'));

    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByTestId('toggle-play-pause'));
      await user.click(screen.getByTestId('toggle-play-pause'));
    }

    const initialElapsed = parseInt(screen.getByTestId('elapsed-seconds').textContent || '0');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const finalElapsed = parseInt(screen.getByTestId('elapsed-seconds').textContent || '0');

    expect(finalElapsed - initialElapsed).toBe(3);
  });

  it('should cleanup interval on component unmount', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    await user.click(screen.getByTestId('play-track'));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});
