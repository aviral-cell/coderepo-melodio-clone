import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerProvider, usePlayer } from '../PlayerContext';
import { TrackWithPopulated } from '../../types/track.types';

/**
 * ============================================================================
 * TIMER INTERVAL CLEANUP - Memory Management
 * ============================================================================
 *
 * SCENARIO:
 * User plays a track, pauses, and resumes multiple times. The progress bar
 * should update once per second.
 *
 * BUG BEHAVIOR:
 * Progress bar moves too fast (jumping 2-3 seconds at a time). Each pause/resume
 * cycle makes the timer speed up even more. React may warn about memory leaks.
 *
 * EXPECTATION:
 * The timer interval should be properly cleaned up when pausing or unmounting.
 * Only ONE interval should ever be active at a time.
 * ============================================================================
 */

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

describe('PlayerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

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
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

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

  /**
   * This test verifies that the playback timer interval is properly cleaned up
   * when pausing. If the interval is NOT cleaned up, multiple intervals will
   * run simultaneously after pause/resume cycles, causing elapsed time to
   * increment faster than it should.
   */
  it('should cleanup interval when pausing - elapsed time should increment correctly after pause/resume', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    );

    // Start playing
    await user.click(screen.getByTestId('play-track'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('0');

    // Wait 2 seconds - elapsed should be 2
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('2');

    // Pause - this should CLEAR the interval
    await user.click(screen.getByTestId('toggle-play-pause'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');

    // Resume - this should start a NEW interval (only one should be running!)
    await user.click(screen.getByTestId('toggle-play-pause'));
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Wait 2 more seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // CRITICAL ASSERTION:
    // Elapsed should be 4 (2 + 2), NOT 6 (2 + 2*2 due to leaked interval)
    // If this test fails with elapsed=6, the interval cleanup is broken!
    expect(screen.getByTestId('elapsed-seconds')).toHaveTextContent('4');
  });
});
