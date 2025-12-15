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

/**
 * FLEXIBLE STATE CHECK HELPERS
 * These helpers check for visual state through multiple indicators,
 * allowing different CSS implementations (classes, inline styles, aria attributes).
 */

/**
 * Check if a button appears visually active/enabled (e.g., green color for shuffle/repeat)
 * Flexible to allow different CSS implementations
 */
function isButtonActive(button: HTMLElement): boolean {
  const className = button.className || "";
  const style = button.getAttribute("style") || "";
  const ariaPressed = button.getAttribute("aria-pressed");
  const dataActive = button.getAttribute("data-active");

  // Check for common active state class patterns
  const hasActiveClass = /green|active|enabled|primary|selected|on\b/i.test(className);
  // Check for green color in inline styles (common green values)
  const hasActiveStyle = /green|#22c55e|#10b981|rgb\(34,\s*197,\s*94\)|rgb\(16,\s*185,\s*129\)/i.test(style);
  // Check aria-pressed attribute
  const hasAriaPressed = ariaPressed === "true";
  // Check data-active attribute
  const hasDataActive = dataActive === "true";

  return hasActiveClass || hasActiveStyle || hasAriaPressed || hasDataActive;
}

/**
 * Check if a button appears visually inactive/subdued (e.g., gray/subdued color)
 */
function isButtonInactive(button: HTMLElement): boolean {
  const className = button.className || "";
  const style = button.getAttribute("style") || "";
  const ariaPressed = button.getAttribute("aria-pressed");
  const dataActive = button.getAttribute("data-active");

  // Check for common inactive state class patterns
  const hasSubduedClass = /subdued|muted|disabled|inactive|secondary|gray|off\b/i.test(className);
  // Active state indicators should be absent
  const noActiveClass = !/green|active|enabled|primary|selected|on\b/i.test(className);
  const noActiveStyle = !/green|#22c55e|#10b981|rgb\(34,\s*197,\s*94\)|rgb\(16,\s*185,\s*129\)/i.test(style);
  // Check aria-pressed is false or absent
  const noAriaPressed = ariaPressed !== "true";
  // Check data-active is false or absent
  const noDataActive = dataActive !== "true";

  return (hasSubduedClass || noActiveClass) && noActiveStyle && noAriaPressed && noDataActive;
}

/**
 * Assert that a button is in active/enabled visual state
 */
function expectButtonToBeActive(button: HTMLElement): void {
  const active = isButtonActive(button);
  if (!active) {
    throw new Error(
      `Expected button to be active but it appears inactive.\n` +
      `className: ${button.className}\n` +
      `style: ${button.getAttribute("style")}\n` +
      `aria-pressed: ${button.getAttribute("aria-pressed")}`
    );
  }
  expect(active).toBe(true);
}

/**
 * Assert that a button is in inactive/subdued visual state
 */
function expectButtonToBeInactive(button: HTMLElement): void {
  const inactive = isButtonInactive(button);
  if (!inactive) {
    throw new Error(
      `Expected button to be inactive but it appears active.\n` +
      `className: ${button.className}\n` +
      `style: ${button.getAttribute("style")}\n` +
      `aria-pressed: ${button.getAttribute("aria-pressed")}`
    );
  }
  expect(inactive).toBe(true);
}

/**
 * Check if an SVG icon represents a specific icon type
 * Flexible to allow different icon libraries (Lucide, FontAwesome, custom SVGs)
 */
function hasIconType(element: HTMLElement, iconType: "play" | "pause" | "repeat" | "repeat1" | "shuffle"): boolean {
  const svg = element.querySelector("svg");
  if (!svg) return false;

  const className = svg.className?.baseVal || svg.getAttribute("class") || "";
  const ariaLabel = svg.getAttribute("aria-label") || "";
  const dataIcon = svg.getAttribute("data-icon") || "";

  // Check class name for icon identifier
  const classMatch = new RegExp(`lucide-${iconType}|fa-${iconType}|icon-${iconType}|${iconType}`, "i").test(className);
  // Check aria-label
  const ariaMatch = new RegExp(iconType, "i").test(ariaLabel);
  // Check data-icon attribute
  const dataMatch = new RegExp(iconType, "i").test(dataIcon);

  return classMatch || ariaMatch || dataMatch;
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

      expectIconType(repeatButton, "repeat1");
      expectButtonToBeActive(repeatButton);
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

      expectButtonToBeActive(repeatButton);
      expectIconType(repeatButton, "repeat1");

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

      expect(getCurrentTrackTitle()).toBe("Track 1");

      const shuffleButton = getShuffleButton();
      await user.click(shuffleButton);

      expectButtonToBeActive(shuffleButton);

      expect(getCurrentTrackTitle()).toBe("Track 1");

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(getCurrentTrackTitle()).toBe("Track 3");
    });
  });
});
