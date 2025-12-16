/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Player Controls Behavior Tests
 * SCENARIO: Testing shuffle, repeat toggles, and progress bar through UI interaction
 * EXPECTATION: UI reflects state changes - icon colors, timer display, track transitions
 */
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlayerBar } from "@/shared/components/layout/PlayerBar";
import { PlayerProvider, usePlayer } from "@/shared/contexts/PlayerContext";
import { ToastProvider } from "@/shared/hooks/useToast";
import type { TrackWithPopulated } from "@/shared/types/player.types";

// Mock shuffleArray to return predictable results (reverse order)
jest.mock("@/shared/utils/playerUtils", () => ({
  shuffleArray: <T,>(arr: T[]): T[] => [...arr].reverse(),
}));

/**
 * Factory function to create mock tracks with populated artist and album data.
 */
function createMockTrack(
  id: string,
  title: string,
  durationInSeconds = 180
): TrackWithPopulated {
  return {
    _id: id,
    title,
    artistId: {
      _id: `artist-${id}`,
      name: `Artist ${id}`,
      imageUrl: "/artist.jpg",
    },
    albumId: {
      _id: `album-${id}`,
      title: `Album ${id}`,
      coverImageUrl: "/cover.jpg",
    },
    durationInSeconds,
    trackNumber: 1,
    genre: "Pop",
    playCount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Test wrapper that provides necessary context providers
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </ToastProvider>
  );
}

/**
 * Helper component to initialize player state with tracks before rendering PlayerBar
 */
function PlayerBarWithTracks({
  tracks,
  startIndex = 0,
}: {
  tracks: TrackWithPopulated[];
  startIndex?: number;
}) {
  const { playTracks } = usePlayer();
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!initialized.current && tracks.length > 0) {
      playTracks(tracks, startIndex);
      initialized.current = true;
    }
  }, [tracks, startIndex, playTracks]);

  return <PlayerBar />;
}

/**
 * Helper to get the shuffle button by data-testid
 */
function getShuffleButton(): HTMLElement {
  return screen.getByTestId("shuffle-button");
}

/**
 * Helper to get the repeat button by data-testid
 */
function getRepeatButton(): HTMLElement {
  return screen.getByTestId("repeat-button");
}

/**
 * Helper to get play/pause button by data-testid
 */
function getPlayPauseButton(): HTMLElement {
  return screen.getByTestId("play-pause-button");
}

/**
 * Helper to get skip forward (next) button by data-testid
 */
function getNextButton(): HTMLElement {
  return screen.getByTestId("next-button");
}

/**
 * Helper to get skip back (previous) button by data-testid
 */
function getPreviousButton(): HTMLElement {
  return screen.getByTestId("previous-button");
}

/**
 * Helper to get elapsed time display by data-testid
 */
function getElapsedTimeDisplay(): string {
  return screen.getByTestId("elapsed-time").textContent || "0:00";
}

/**
 * Helper to get the track title from the player by data-testid
 */
function getCurrentTrackTitle(): string | null {
  try {
    return screen.getByTestId("current-track-title").textContent;
  } catch {
    return null;
  }
}

/**
 * Check if a button is in active state via data-active attribute
 */
function isButtonActive(button: HTMLElement): boolean {
  return button.getAttribute("data-active") === "true";
}

/**
 * Check if a button is in inactive state via data-active attribute
 */
function isButtonInactive(button: HTMLElement): boolean {
  const dataActive = button.getAttribute("data-active");
  return dataActive === "false" || dataActive === null;
}

/**
 * Assert that a button is in active state via data-active attribute
 */
function expectButtonToBeActive(button: HTMLElement): void {
  const dataActive = button.getAttribute("data-active");
  if (dataActive !== "true") {
    throw new Error(
      `Expected button to be active (data-active="true") but got data-active="${dataActive}"`
    );
  }
  expect(dataActive).toBe("true");
}

/**
 * Assert that a button is in inactive state via data-active attribute
 */
function expectButtonToBeInactive(button: HTMLElement): void {
  const dataActive = button.getAttribute("data-active");
  if (dataActive === "true") {
    throw new Error(
      `Expected button to be inactive (data-active="false") but got data-active="${dataActive}"`
    );
  }
  expect(dataActive).not.toBe("true");
}

function hasIconType(element: HTMLElement, iconType: "play" | "pause" | "repeat" | "repeat1" | "shuffle"): boolean {
  // Check for data-testid on the icon inside the element
  const iconTestId = `${iconType}-icon`;
  const iconElement = element.querySelector(`[data-testid="${iconTestId}"]`);
  return iconElement !== null;
}

/**
 * Assert that element contains a specific icon type
 */
function expectIconType(element: HTMLElement, iconType: "play" | "pause" | "repeat" | "repeat1" | "shuffle"): void {
  const hasIcon = hasIconType(element, iconType);
  if (!hasIcon) {
    const svg = element.querySelector("svg");
    throw new Error(
      `Expected element to have ${iconType} icon.\n` +
      `SVG class: ${svg?.getAttribute("class")}\n` +
      `SVG aria-label: ${svg?.getAttribute("aria-label")}`
    );
  }
  expect(hasIcon).toBe(true);
}

describe("PlayerBar Controls Behavior Tests", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("Shuffle Toggle", () => {
    it("should display shuffle button with subdued color initially when no track is playing", () => {
      render(
        <TestWrapper>
          <PlayerBar />
        </TestWrapper>
      );

      const shuffleButton = getShuffleButton();
      expectButtonToBeInactive(shuffleButton);
    });

    it("should change shuffle button to green when shuffle is enabled", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track1 = createMockTrack("1", "Track 1");
      const track2 = createMockTrack("2", "Track 2");
      const track3 = createMockTrack("3", "Track 3");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2, track3]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const shuffleButton = getShuffleButton();

      expectButtonToBeInactive(shuffleButton);

      await user.click(shuffleButton);

      expectButtonToBeActive(shuffleButton);
    });

    it("should return shuffle button to subdued when shuffle is disabled", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track1 = createMockTrack("1", "Track 1");
      const track2 = createMockTrack("2", "Track 2");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const shuffleButton = getShuffleButton();

      await user.click(shuffleButton);
      expectButtonToBeActive(shuffleButton);

      await user.click(shuffleButton);
      expectButtonToBeInactive(shuffleButton);
    });
  });

  describe("Repeat Toggle", () => {
    it("should display repeat button with subdued color initially (repeat off)", () => {
      render(
        <TestWrapper>
          <PlayerBar />
        </TestWrapper>
      );

      const repeatButton = getRepeatButton();
      expectButtonToBeInactive(repeatButton);
    });

    it("should cycle repeat mode: off -> all (green) -> one (green, Repeat1 icon) -> off (subdued)", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track = createMockTrack("1", "Track 1");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const repeatButton = getRepeatButton();

      expectButtonToBeInactive(repeatButton);
      expectIconType(repeatButton, "repeat");

      await user.click(repeatButton);
      expectButtonToBeActive(repeatButton);
      expectIconType(repeatButton, "repeat");

      await user.click(repeatButton);
      expectButtonToBeActive(repeatButton);
      expectIconType(repeatButton, "repeat1");

      await user.click(repeatButton);
      expectButtonToBeInactive(repeatButton);
      expectIconType(repeatButton, "repeat");
    });

  });

  describe("Progress Bar (Timer)", () => {
    it("should display 0:00 elapsed time initially", () => {
      render(
        <TestWrapper>
          <PlayerBar />
        </TestWrapper>
      );

      const elapsedTime = getElapsedTimeDisplay();
      expect(elapsedTime).toBe("0:00");
    });

    it("should increment elapsed time every second while playing", async () => {
      const track = createMockTrack("1", "Track 1", 180);

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(getElapsedTimeDisplay()).toBe("0:00");

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:01");

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:02");

      await act(async () => {
        jest.advanceTimersByTime(58000);
      });

      expect(getElapsedTimeDisplay()).toBe("1:00");
    });

    it("should show total duration of current track", async () => {
      const track = createMockTrack("1", "Track 1", 195); // 3:15

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const totalDuration = screen.getByTestId("total-duration");
      expect(totalDuration).toHaveTextContent("3:15");
    });
  });

  describe("Track End Behavior", () => {
    it("should restart track when repeat mode is one and track ends", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      // Use 2 tracks to verify repeat-one keeps same track (doesn't advance like repeat-all)
      const track1 = createMockTrack("1", "Track 1", 5); // 5 second track
      const track2 = createMockTrack("2", "Track 2", 5);

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2]} startIndex={0} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(getCurrentTrackTitle()).toBe("Track 1");

      const repeatButton = getRepeatButton();
      await user.click(repeatButton);
      await user.click(repeatButton);

      expectButtonToBeActive(repeatButton);
      expectIconType(repeatButton, "repeat1");

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:04");

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // With repeat-one, track should restart (not advance to Track 2)
      expect(getElapsedTimeDisplay()).toBe("0:01");
      expect(getCurrentTrackTitle()).toBe("Track 1"); // Still Track 1, not Track 2
    });

    it("should go to first track when repeat mode is all on last track", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track1 = createMockTrack("1", "Track 1", 5);
      const track2 = createMockTrack("2", "Track 2", 5);

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2]} startIndex={1} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(getCurrentTrackTitle()).toBe("Track 2");

      const repeatButton = getRepeatButton();
      await user.click(repeatButton);

      expectButtonToBeActive(repeatButton);
      expectIconType(repeatButton, "repeat");

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(getCurrentTrackTitle()).toBe("Track 1");

      expect(getElapsedTimeDisplay()).toBe("0:00");
    });

    it("should stop playback when repeat mode is off on last track", async () => {
      const track1 = createMockTrack("1", "Track 1", 3);

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const repeatButton = getRepeatButton();
      expectButtonToBeInactive(repeatButton);

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:00");

      const playPauseButton = getPlayPauseButton();
      expectIconType(playPauseButton, "play");
    });

    it("should advance to next track when current track ends with repeat off", async () => {
      const track1 = createMockTrack("1", "Track 1", 3);
      const track2 = createMockTrack("2", "Track 2", 5);

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2]} startIndex={0} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(getCurrentTrackTitle()).toBe("Track 1");

      const repeatButton = getRepeatButton();
      expectButtonToBeInactive(repeatButton);

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(getCurrentTrackTitle()).toBe("Track 2");

      expect(getElapsedTimeDisplay()).toBe("0:00");
    });
  });

  describe("Play/Pause Toggle", () => {
    it("should show Pause icon when playing", async () => {
      const track = createMockTrack("1", "Track 1");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const playPauseButton = getPlayPauseButton();
      expectIconType(playPauseButton, "pause");
    });

    it("should toggle between play and pause on click", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track = createMockTrack("1", "Track 1");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const playPauseButton = getPlayPauseButton();

      expectIconType(playPauseButton, "pause");

      await user.click(playPauseButton);

      expectIconType(playPauseButton, "play");

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:00");

      await user.click(playPauseButton);

      expectIconType(playPauseButton, "pause");

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:01");
    });
  });

  describe("Next/Previous Controls", () => {
    it("should advance to next track when next button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track1 = createMockTrack("1", "Track 1");
      const track2 = createMockTrack("2", "Track 2");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2]} startIndex={0} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(getCurrentTrackTitle()).toBe("Track 1");

      const nextButton = getNextButton();
      await user.click(nextButton);

      expect(getCurrentTrackTitle()).toBe("Track 2");
    });

    it("should go to previous track when previous button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track1 = createMockTrack("1", "Track 1");
      const track2 = createMockTrack("2", "Track 2");

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2]} startIndex={1} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(getCurrentTrackTitle()).toBe("Track 2");

      const prevButton = getPreviousButton();
      await user.click(prevButton);

      expect(getCurrentTrackTitle()).toBe("Track 1");
    });
  });

  describe("Shuffle with Track Transitions", () => {
    it("should advance through shuffled queue order when shuffle is enabled", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track1 = createMockTrack("1", "Track 1", 3);
      const track2 = createMockTrack("2", "Track 2", 3);
      const track3 = createMockTrack("3", "Track 3", 3);

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track1, track2, track3]} startIndex={0} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const initialTrack = getCurrentTrackTitle();
      expect(initialTrack).toBe("Track 1");

      const shuffleButton = getShuffleButton();
      await user.click(shuffleButton);

      expectButtonToBeActive(shuffleButton);

      // Current track should still be Track 1 immediately after enabling shuffle
      expect(getCurrentTrackTitle()).toBe("Track 1");

      // Let the track end and advance to next in shuffled queue
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // After shuffle, the next track should NOT be the sequential next track (Track 2)
      // It should be a different track from the shuffled queue
      const nextTrack = getCurrentTrackTitle();
      expect(nextTrack).not.toBe("Track 2"); // Not sequential - shuffle is working
      expect(nextTrack).not.toBe(initialTrack); // Should have advanced to a new track
    });
  });
});
