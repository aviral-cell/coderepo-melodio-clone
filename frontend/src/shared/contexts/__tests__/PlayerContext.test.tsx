import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerProvider, usePlayer } from '../PlayerContext';
import { TrackWithPopulated } from '../../types/track.types';

/**
 * ============================================================================
 * BUG G: TIMER INTERVAL CLEANUP - Memory Management
 * ============================================================================
 *
 * EXPECTED BEHAVIOR:
 * When playback is paused or the component unmounts, the timer interval should
 * be cleared. This prevents memory leaks and ensures elapsed time increments
 * correctly (once per second, not multiple times).
 *
 * WHAT THE BUG LOOKS LIKE:
 * - Progress bar moves too fast (jumping 2-3 seconds at a time)
 * - Pausing and resuming multiple times makes the timer speed up
 * - React warns about memory leaks from uncleared intervals
 *
 * WHERE TO LOOK: PlayerContext.tsx -> useEffect that creates the interval
 *
 * HINT: The useEffect should return a cleanup function that calls clearInterval.
 * Example:
 *   useEffect(() => {
 *     if (isPlaying) {
 *       const interval = setInterval(() => dispatch({ type: 'TICK' }), 1000);
 *       return () => clearInterval(interval);  // <-- This is missing!
 *     }
 *   }, [isPlaying, currentTrack]);
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
   * ============================================================================
   * BUG G TEST: Timer should only increment once per second, not multiple times
   * ============================================================================
   *
   * This test verifies that the playback timer interval is properly cleaned up
   * when pausing. If the interval is NOT cleaned up, multiple intervals will
   * run simultaneously after pause/resume cycles, causing elapsed time to
   * increment faster than it should.
   *
   * SCENARIO:
   * 1. Play a track -> start 1 interval
   * 2. Wait 2 seconds -> elapsed should be 2
   * 3. Pause -> interval should be CLEARED
   * 4. Resume -> start NEW interval (should be only 1 running)
   * 5. Wait 2 more seconds -> elapsed should be 4
   *
   * BUG BEHAVIOR:
   * - Without cleanup, pausing doesn't clear the old interval
   * - Resuming starts a NEW interval while old one still runs
   * - After pause/resume, TWO intervals tick simultaneously
   * - Elapsed time increments by 2 every second instead of 1!
   * - After 2 more seconds, elapsed would be 6 instead of 4
   * ============================================================================
   */
  it('should cleanup interval when pausing - Bug G: elapsed time should increment correctly after pause/resume', async () => {
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
