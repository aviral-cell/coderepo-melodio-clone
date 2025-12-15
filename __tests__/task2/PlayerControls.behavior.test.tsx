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
 * Helper to get the shuffle button by looking for the button with shuffle icon class
 */
function getShuffleButton(): HTMLElement {
  const buttons = screen.getAllByRole("button");
  const shuffleBtn = buttons.find((btn) => {
    const svg = btn.querySelector("svg");
    return svg?.classList.contains("lucide-shuffle");
  });
  if (!shuffleBtn) {
    throw new Error("Shuffle button not found");
  }
  return shuffleBtn;
}

/**
 * Helper to get the repeat button
 */
function getRepeatButton(): HTMLElement {
  const buttons = screen.getAllByRole("button");
  const repeatBtn = buttons.find((btn) => {
    const svg = btn.querySelector("svg");
    return (
      svg?.classList.contains("lucide-repeat") ||
      svg?.classList.contains("lucide-repeat1")
    );
  });
  if (!repeatBtn) {
    throw new Error("Repeat button not found");
  }
  return repeatBtn;
}

/**
 * Helper to get play/pause button (the center rounded button)
 */
function getPlayPauseButton(): HTMLElement {
  const button = document.querySelector(
    'button[type="button"].rounded-full'
  ) as HTMLElement;
  if (!button) {
    throw new Error("Play/Pause button not found");
  }
  return button;
}

/**
 * Helper to get skip forward (next) button
 */
function getNextButton(): HTMLElement {
  const buttons = screen.getAllByRole("button");
  const nextBtn = buttons.find((btn) => {
    const svg = btn.querySelector("svg");
    return svg?.classList.contains("lucide-skip-forward");
  });
  if (!nextBtn) {
    throw new Error("Next button not found");
  }
  return nextBtn;
}

/**
 * Helper to get skip back (previous) button
 */
function getPreviousButton(): HTMLElement {
  const buttons = screen.getAllByRole("button");
  const prevBtn = buttons.find((btn) => {
    const svg = btn.querySelector("svg");
    return svg?.classList.contains("lucide-skip-back");
  });
  if (!prevBtn) {
    throw new Error("Previous button not found");
  }
  return prevBtn;
}

/**
 * Helper to get elapsed time display (first time span)
 */
function getElapsedTimeDisplay(): string {
  const timeDisplays = screen.getAllByText(/^\d+:\d{2}$/);
  return timeDisplays[0]?.textContent || "0:00";
}

/**
 * Helper to get the track title from the player (the title in the track info section)
 */
function getCurrentTrackTitle(): string | null {
  const footer = document.querySelector("footer");
  if (!footer) return null;

  const titleElement = footer.querySelector(
    ".truncate.text-sm.text-white"
  ) as HTMLElement;
  return titleElement?.textContent || null;
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
      expect(shuffleButton).toHaveClass("text-melodio-text-subdued");
      expect(shuffleButton).not.toHaveClass("text-melodio-green");
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

      expect(shuffleButton).toHaveClass("text-melodio-text-subdued");

      await user.click(shuffleButton);

      expect(shuffleButton).toHaveClass("text-melodio-green");
      expect(shuffleButton).not.toHaveClass("text-melodio-text-subdued");
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
      expect(shuffleButton).toHaveClass("text-melodio-green");

      await user.click(shuffleButton);
      expect(shuffleButton).toHaveClass("text-melodio-text-subdued");
      expect(shuffleButton).not.toHaveClass("text-melodio-green");
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
      expect(repeatButton).toHaveClass("text-melodio-text-subdued");
      expect(repeatButton).not.toHaveClass("text-melodio-green");
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

      expect(repeatButton).toHaveClass("text-melodio-text-subdued");
      let svg = repeatButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-repeat");

      await user.click(repeatButton);
      expect(repeatButton).toHaveClass("text-melodio-green");
      expect(repeatButton).not.toHaveClass("text-melodio-text-subdued");
      svg = repeatButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-repeat");

      await user.click(repeatButton);
      expect(repeatButton).toHaveClass("text-melodio-green");
      svg = repeatButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-repeat1");

      await user.click(repeatButton);
      expect(repeatButton).toHaveClass("text-melodio-text-subdued");
      expect(repeatButton).not.toHaveClass("text-melodio-green");
      svg = repeatButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-repeat");
    });

    it("should show Repeat1 icon when repeat mode is one", async () => {
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

      await user.click(repeatButton);
      await user.click(repeatButton);

      const svg = repeatButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-repeat1");
      expect(repeatButton).toHaveClass("text-melodio-green");
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

      const timeDisplays = screen.getAllByText(/^\d+:\d{2}$/);
      expect(timeDisplays[1]).toHaveTextContent("3:15");
    });
  });

  describe("Track End Behavior", () => {
    it("should restart track when repeat mode is one and track ends", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const track = createMockTrack("1", "Track 1", 5); // 5 second track

      render(
        <TestWrapper>
          <PlayerBarWithTracks tracks={[track]} />
        </TestWrapper>
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const repeatButton = getRepeatButton();
      await user.click(repeatButton);
      await user.click(repeatButton);

      expect(repeatButton).toHaveClass("text-melodio-green");
      expect(repeatButton.querySelector("svg")).toHaveClass("lucide-repeat1");

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:04");

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:00");

      expect(getCurrentTrackTitle()).toBe("Track 1");
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

      expect(repeatButton).toHaveClass("text-melodio-green");
      expect(repeatButton.querySelector("svg")).toHaveClass("lucide-repeat");

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
      expect(repeatButton).toHaveClass("text-melodio-text-subdued");

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:00");

      const playPauseButton = getPlayPauseButton();
      const svg = playPauseButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-play");
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
      expect(repeatButton).toHaveClass("text-melodio-text-subdued");

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
      const svg = playPauseButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-pause");
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

      let svg = playPauseButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-pause");

      await user.click(playPauseButton);

      svg = playPauseButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-play");

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(getElapsedTimeDisplay()).toBe("0:00");

      await user.click(playPauseButton);

      svg = playPauseButton.querySelector("svg");
      expect(svg).toHaveClass("lucide-pause");

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

      expect(getCurrentTrackTitle()).toBe("Track 1");

      const shuffleButton = getShuffleButton();
      await user.click(shuffleButton);

      expect(shuffleButton).toHaveClass("text-melodio-green");

      expect(getCurrentTrackTitle()).toBe("Track 1");

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(getCurrentTrackTitle()).toBe("Track 3");
    });
  });
});
