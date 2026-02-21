/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlayerBar } from "@/shared/components/layout/PlayerBar";
import { PlayerProvider, usePlayer } from "@/shared/contexts/PlayerContext";
import { ToastProvider } from "@/shared/hooks/useToast";
import type { TrackWithPopulated } from "@/shared/types/player.types";

jest.mock("@/shared/utils/playerUtils", () => ({
	shuffleArray: <T,>(arr: T[]): T[] => [...arr].reverse(),
}));

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

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<ToastProvider>
			<PlayerProvider>{children}</PlayerProvider>
		</ToastProvider>
	);
}

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

function getShuffleButton(): HTMLElement {
	return screen.getByTestId("shuffle-button");
}

function getRepeatButton(): HTMLElement {
	return screen.getByTestId("repeat-button");
}

function getPlayPauseButton(): HTMLElement {
	return screen.getByTestId("play-pause-button");
}

function getNextButton(): HTMLElement {
	return screen.getByTestId("next-button");
}

function getPreviousButton(): HTMLElement {
	return screen.getByTestId("previous-button");
}

function getElapsedTimeDisplay(): string {
	return screen.getByTestId("elapsed-time").textContent || "0:00";
}

function getCurrentTrackTitle(): string | null {
	try {
		return screen.getByTestId("current-track-title").textContent;
	} catch {
		return null;
	}
}

function isButtonActive(button: HTMLElement): boolean {
	return button.getAttribute("data-active") === "true";
}

function isButtonInactive(button: HTMLElement): boolean {
	const dataActive = button.getAttribute("data-active");
	return dataActive === "false" || dataActive === null;
}

function expectButtonToBeActive(button: HTMLElement): void {
	const dataActive = button.getAttribute("data-active");
	if (dataActive !== "true") {
		throw new Error(
			`Expected button to be active (data-active="true") but got data-active="${dataActive}"`
		);
	}
	expect(dataActive).toBe("true");
}

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
	const iconTestId = `${iconType}-icon`;
	const iconElement = element.querySelector(`[data-testid="${iconTestId}"]`);
	return iconElement !== null;
}

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

			// Click shuffle
			await user.click(shuffleButton);

			// Verify shuffle is active
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

			// Enable shuffle
			await user.click(shuffleButton);
			expectButtonToBeActive(shuffleButton);

			// Disable shuffle
			await user.click(shuffleButton);
			expectButtonToBeInactive(shuffleButton);
		});
	});

	describe("Repeat Toggle", () => {

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

			// Initial: off
			expectButtonToBeInactive(repeatButton);
			expectIconType(repeatButton, "repeat");

			// Click 1: repeat all
			await user.click(repeatButton);
			expectButtonToBeActive(repeatButton);
			expectIconType(repeatButton, "repeat");

			// Click 2: repeat one
			await user.click(repeatButton);
			expectButtonToBeActive(repeatButton);
			expectIconType(repeatButton, "repeat1");

			// Click 3: off
			await user.click(repeatButton);
			expectButtonToBeInactive(repeatButton);
			expectIconType(repeatButton, "repeat");
		});
	});

	describe("Progress Bar (Timer)", () => {

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

			// Advance 1 second
			await act(async () => {
				jest.advanceTimersByTime(1000);
			});
			expect(getElapsedTimeDisplay()).toBe("0:01");

			// Advance 1 more second
			await act(async () => {
				jest.advanceTimersByTime(1000);
			});
			expect(getElapsedTimeDisplay()).toBe("0:02");

			// Advance to 1 minute
			await act(async () => {
				jest.advanceTimersByTime(58000);
			});
			expect(getElapsedTimeDisplay()).toBe("1:00");
		});
	});

	describe("Track End Behavior", () => {
		it("should restart track when repeat mode is one and track ends", async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			const track1 = createMockTrack("1", "Track 1", 5);
			const track2 = createMockTrack("2", "Track 2", 5);

			render(
				<TestWrapper>
					<PlayerBarWithTracks tracks={[track1, track2]} startIndex={0} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(100);
			});

			// Verify initial state
			expect(getCurrentTrackTitle()).toBe("Track 1");
			expectIconType(getPlayPauseButton(), "pause");

			// Set repeat mode to "one"
			const repeatButton = getRepeatButton();
			await user.click(repeatButton);
			await user.click(repeatButton);
			expectButtonToBeActive(repeatButton);
			expectIconType(repeatButton, "repeat1");

			// Advance time (track playing)
			await act(async () => {
				jest.advanceTimersByTime(4000);
			});
			expect(getElapsedTimeDisplay()).toBe("0:04");

			// Let track end
			await act(async () => {
				jest.advanceTimersByTime(2000);
			});

			// AFTER: Track should restart
			expect(getElapsedTimeDisplay()).toBe("0:01");
			expect(getCurrentTrackTitle()).toBe("Track 1");
			expectIconType(getPlayPauseButton(), "pause");
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

			// Verify initial state
			expect(getCurrentTrackTitle()).toBe("Track 2");
			expectIconType(getPlayPauseButton(), "pause");

			// Set repeat mode to "all"
			const repeatButton = getRepeatButton();
			await user.click(repeatButton);
			expectButtonToBeActive(repeatButton);
			expectIconType(repeatButton, "repeat");

			// Advance time (track playing)
			await act(async () => {
				jest.advanceTimersByTime(3000);
			});
			expect(getElapsedTimeDisplay()).not.toBe("0:00");

			// Let track end
			await act(async () => {
				jest.advanceTimersByTime(2000);
			});

			// AFTER: Should loop to first track
			expect(getCurrentTrackTitle()).toBe("Track 1");
			expect(getElapsedTimeDisplay()).toBe("0:00");
			expectIconType(getPlayPauseButton(), "pause");
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

			// Verify initial state
			expect(getCurrentTrackTitle()).toBe("Track 1");
			expectIconType(getPlayPauseButton(), "pause");

			const repeatButton = getRepeatButton();
			expectButtonToBeInactive(repeatButton);

			// Advance time (track playing)
			await act(async () => {
				jest.advanceTimersByTime(1000);
			});
			expect(getElapsedTimeDisplay()).not.toBe("0:00");

			// Let track end
			await act(async () => {
				jest.advanceTimersByTime(2000);
			});

			// AFTER: Should stop playback
			expect(getElapsedTimeDisplay()).toBe("0:00");
			expectIconType(getPlayPauseButton(), "play");
			expect(getCurrentTrackTitle()).toBe("Track 1");
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

			// Verify initial state
			expect(getCurrentTrackTitle()).toBe("Track 1");
			expectIconType(getPlayPauseButton(), "pause");

			const repeatButton = getRepeatButton();
			expectButtonToBeInactive(repeatButton);

			// Advance time (track playing)
			await act(async () => {
				jest.advanceTimersByTime(1000);
			});
			expect(getElapsedTimeDisplay()).not.toBe("0:00");

			// Let track end
			await act(async () => {
				jest.advanceTimersByTime(2000);
			});

			// AFTER: Should advance to next track
			expect(getCurrentTrackTitle()).toBe("Track 2");
			expect(getElapsedTimeDisplay()).toBe("0:00");
			expectIconType(getPlayPauseButton(), "pause");
		});
	});

	describe("Play/Pause Toggle", () => {

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

			// Initially playing (pause icon shown)
			expectIconType(playPauseButton, "pause");

			// Click to pause
			await user.click(playPauseButton);
			expectIconType(playPauseButton, "play");

			// Time should NOT advance while paused
			await act(async () => {
				jest.advanceTimersByTime(2000);
			});
			expect(getElapsedTimeDisplay()).toBe("0:00");

			// Click to resume
			await user.click(playPauseButton);
			expectIconType(playPauseButton, "pause");

			// Time should advance after resume
			await act(async () => {
				jest.advanceTimersByTime(1000);
			});
			expect(getElapsedTimeDisplay()).toBe("0:01");
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

			// Enable shuffle
			const shuffleButton = getShuffleButton();
			await user.click(shuffleButton);
			expectButtonToBeActive(shuffleButton);

			// Current track unchanged after enabling shuffle
			expect(getCurrentTrackTitle()).toBe("Track 1");

			// Let track end
			await act(async () => {
				jest.advanceTimersByTime(3000);
			});

			// Verify track advanced
			const nextTrack = getCurrentTrackTitle();
			expect(nextTrack).not.toBe(initialTrack);
		});
	});
});
