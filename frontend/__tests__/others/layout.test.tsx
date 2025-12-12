/**
 * @jest-environment jsdom
 */

/**
 * Phase 4.4: Post-Implementation Component Tests - Layout
 *
 * Tests for layout-related contexts: SidebarContext toggle, PlayerContext controls
 *
 * Note: Full component tests for Sidebar and PlayerBar are complex due to many
 * nested dependencies. These tests focus on context behavior which is the core
 * functionality being tested.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

// Import contexts (no API dependencies)
import { SidebarProvider, useSidebar } from "@/shared/contexts/SidebarContext";
import { PlayerProvider, usePlayer } from "@/shared/contexts/PlayerContext";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const createMockTrack = (id: string): TrackWithPopulated => ({
	_id: id,
	title: `Track ${id}`,
	durationInSeconds: 180,
	duration: 180,
	trackNumber: 1,
	audioUrl: `http://example.com/${id}.mp3`,
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
	artistId: {
		_id: "artist-1",
		name: "Test Artist",
		imageUrl: "http://example.com/artist.jpg",
	},
	albumId: {
		_id: "album-1",
		title: "Test Album",
		coverImageUrl: "http://example.com/album.jpg",
	},
});

// Helper component to test sidebar toggle
function SidebarToggleTester() {
	const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar();
	return (
		<div>
			<span data-testid="collapsed-state">{isCollapsed ? "collapsed" : "expanded"}</span>
			<button onClick={toggleSidebar} data-testid="toggle-btn">
				Toggle
			</button>
			<button onClick={() => setIsCollapsed(true)} data-testid="collapse-btn">
				Collapse
			</button>
			<button onClick={() => setIsCollapsed(false)} data-testid="expand-btn">
				Expand
			</button>
		</div>
	);
}

// Helper component to test player controls
function PlayerControlTester() {
	const { state, playTrack, playTracks, togglePlayPause, toggleShuffle, toggleRepeat, setVolume, next, previous, seek, addToQueue, clearQueue } =
		usePlayer();
	const track1 = createMockTrack("track-1");
	const track2 = createMockTrack("track-2");
	const track3 = createMockTrack("track-3");

	return (
		<div>
			<span data-testid="is-playing">{state.isPlaying ? "playing" : "paused"}</span>
			<span data-testid="shuffle-enabled">{state.shuffleEnabled ? "on" : "off"}</span>
			<span data-testid="repeat-mode">{state.repeatMode}</span>
			<span data-testid="volume">{state.volume}</span>
			<span data-testid="current-track">{state.currentTrack?.title || "none"}</span>
			<span data-testid="queue-length">{state.queue.length}</span>
			<span data-testid="queue-index">{state.queueIndex}</span>
			<span data-testid="elapsed">{state.elapsedSeconds}</span>
			<button onClick={() => playTrack(track1)} data-testid="play-track-btn">
				Play Track 1
			</button>
			<button onClick={() => playTracks([track1, track2, track3], 0)} data-testid="play-tracks-btn">
				Play All Tracks
			</button>
			<button onClick={togglePlayPause} data-testid="toggle-play-btn">
				Toggle Play
			</button>
			<button onClick={toggleShuffle} data-testid="toggle-shuffle-btn">
				Toggle Shuffle
			</button>
			<button onClick={toggleRepeat} data-testid="toggle-repeat-btn">
				Toggle Repeat
			</button>
			<button onClick={() => setVolume(50)} data-testid="set-volume-btn">
				Set Volume 50
			</button>
			<button onClick={next} data-testid="next-btn">
				Next
			</button>
			<button onClick={previous} data-testid="previous-btn">
				Previous
			</button>
			<button onClick={() => seek(60)} data-testid="seek-btn">
				Seek to 60s
			</button>
			<button onClick={() => addToQueue(track2)} data-testid="add-queue-btn">
				Add to Queue
			</button>
			<button onClick={clearQueue} data-testid="clear-queue-btn">
				Clear Queue
			</button>
		</div>
	);
}

describe("Layout Context Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset window width for consistent tests
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 1200,
		});
	});

	describe("SidebarContext", () => {
		it("should provide default expanded state on desktop", () => {
			render(
				<SidebarProvider>
					<SidebarToggleTester />
				</SidebarProvider>
			);

			// Desktop default is expanded (width >= 1024)
			expect(screen.getByTestId("collapsed-state")).toHaveTextContent("expanded");
		});

		it("should toggle sidebar collapsed state", () => {
			render(
				<SidebarProvider>
					<SidebarToggleTester />
				</SidebarProvider>
			);

			// Toggle to collapsed
			fireEvent.click(screen.getByTestId("toggle-btn"));
			expect(screen.getByTestId("collapsed-state")).toHaveTextContent("collapsed");

			// Toggle back to expanded
			fireEvent.click(screen.getByTestId("toggle-btn"));
			expect(screen.getByTestId("collapsed-state")).toHaveTextContent("expanded");
		});

		it("should allow direct state setting via setIsCollapsed", () => {
			render(
				<SidebarProvider>
					<SidebarToggleTester />
				</SidebarProvider>
			);

			// Direct collapse
			fireEvent.click(screen.getByTestId("collapse-btn"));
			expect(screen.getByTestId("collapsed-state")).toHaveTextContent("collapsed");

			// Direct expand
			fireEvent.click(screen.getByTestId("expand-btn"));
			expect(screen.getByTestId("collapsed-state")).toHaveTextContent("expanded");
		});

		it("should collapse on mobile viewport resize", async () => {
			// Start with desktop width
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 1200,
			});

			render(
				<SidebarProvider>
					<SidebarToggleTester />
				</SidebarProvider>
			);

			expect(screen.getByTestId("collapsed-state")).toHaveTextContent("expanded");

			// Simulate resize to mobile
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 800,
			});
			fireEvent(window, new Event("resize"));

			await waitFor(() => {
				expect(screen.getByTestId("collapsed-state")).toHaveTextContent("collapsed");
			});
		});

		it("should throw error when useSidebar is used outside provider", () => {
			// Suppress console.error for this test
			const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

			expect(() => {
				render(<SidebarToggleTester />);
			}).toThrow("useSidebar must be used within a SidebarProvider");

			consoleSpy.mockRestore();
		});
	});

	describe("PlayerContext Controls", () => {
		const renderPlayerTester = () => {
			return render(
				<PlayerProvider>
					<PlayerControlTester />
				</PlayerProvider>
			);
		};

		it("should have correct initial state", () => {
			renderPlayerTester();

			expect(screen.getByTestId("is-playing")).toHaveTextContent("paused");
			expect(screen.getByTestId("shuffle-enabled")).toHaveTextContent("off");
			expect(screen.getByTestId("repeat-mode")).toHaveTextContent("off");
			expect(screen.getByTestId("volume")).toHaveTextContent("80"); // default volume is 80
			expect(screen.getByTestId("current-track")).toHaveTextContent("none");
			expect(screen.getByTestId("queue-length")).toHaveTextContent("0");
		});

		it("should play a single track", async () => {
			renderPlayerTester();

			fireEvent.click(screen.getByTestId("play-track-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("current-track")).toHaveTextContent("Track track-1");
				expect(screen.getByTestId("is-playing")).toHaveTextContent("playing");
				expect(screen.getByTestId("queue-length")).toHaveTextContent("1");
			});
		});

		it("should play multiple tracks with queue", async () => {
			renderPlayerTester();

			fireEvent.click(screen.getByTestId("play-tracks-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("current-track")).toHaveTextContent("Track track-1");
				expect(screen.getByTestId("queue-length")).toHaveTextContent("3");
				expect(screen.getByTestId("queue-index")).toHaveTextContent("0");
			});
		});

		it("should toggle play/pause state", async () => {
			renderPlayerTester();

			// Play a track first
			fireEvent.click(screen.getByTestId("play-track-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("playing");
			});

			// Toggle to pause
			fireEvent.click(screen.getByTestId("toggle-play-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("paused");
			});

			// Toggle back to playing
			fireEvent.click(screen.getByTestId("toggle-play-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("playing");
			});
		});

		it("should toggle shuffle mode", async () => {
			renderPlayerTester();

			// Need multiple tracks for shuffle to work
			fireEvent.click(screen.getByTestId("play-tracks-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("queue-length")).toHaveTextContent("3");
			});

			// Toggle shuffle on
			fireEvent.click(screen.getByTestId("toggle-shuffle-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("shuffle-enabled")).toHaveTextContent("on");
			});

			// Toggle shuffle off
			fireEvent.click(screen.getByTestId("toggle-shuffle-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("shuffle-enabled")).toHaveTextContent("off");
			});
		});

		it("should cycle repeat mode through off -> all -> one -> off", async () => {
			renderPlayerTester();

			expect(screen.getByTestId("repeat-mode")).toHaveTextContent("off");

			// Cycle to 'all'
			fireEvent.click(screen.getByTestId("toggle-repeat-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("repeat-mode")).toHaveTextContent("all");
			});

			// Cycle to 'one'
			fireEvent.click(screen.getByTestId("toggle-repeat-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("repeat-mode")).toHaveTextContent("one");
			});

			// Cycle back to 'off'
			fireEvent.click(screen.getByTestId("toggle-repeat-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("repeat-mode")).toHaveTextContent("off");
			});
		});

		it("should set volume", async () => {
			renderPlayerTester();

			expect(screen.getByTestId("volume")).toHaveTextContent("80"); // default is 80

			fireEvent.click(screen.getByTestId("set-volume-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("volume")).toHaveTextContent("50");
			});
		});

		it("should navigate to next track in queue", async () => {
			renderPlayerTester();

			// Play multiple tracks
			fireEvent.click(screen.getByTestId("play-tracks-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("current-track")).toHaveTextContent("Track track-1");
			});

			// Go to next
			fireEvent.click(screen.getByTestId("next-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("current-track")).toHaveTextContent("Track track-2");
				expect(screen.getByTestId("queue-index")).toHaveTextContent("1");
			});
		});

		it("should navigate to previous track in queue", async () => {
			renderPlayerTester();

			// Play multiple tracks
			fireEvent.click(screen.getByTestId("play-tracks-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("current-track")).toHaveTextContent("Track track-1");
			});

			// Go to next first
			fireEvent.click(screen.getByTestId("next-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("queue-index")).toHaveTextContent("1");
			});

			// Go back to previous
			fireEvent.click(screen.getByTestId("previous-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("queue-index")).toHaveTextContent("0");
			});
		});

		it("should seek to position", async () => {
			renderPlayerTester();

			// Play a track
			fireEvent.click(screen.getByTestId("play-track-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("playing");
			});

			// Seek to 60 seconds
			fireEvent.click(screen.getByTestId("seek-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("elapsed")).toHaveTextContent("60");
			});
		});

		it("should add track to queue", async () => {
			renderPlayerTester();

			// Play a track first
			fireEvent.click(screen.getByTestId("play-track-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("queue-length")).toHaveTextContent("1");
			});

			// Add another track to queue
			fireEvent.click(screen.getByTestId("add-queue-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("queue-length")).toHaveTextContent("2");
			});
		});

		it("should clear queue (keeps current track)", async () => {
			renderPlayerTester();

			// Play multiple tracks
			fireEvent.click(screen.getByTestId("play-tracks-btn"));
			await waitFor(() => {
				expect(screen.getByTestId("queue-length")).toHaveTextContent("3");
			});

			// Clear queue - keeps current track but removes others
			fireEvent.click(screen.getByTestId("clear-queue-btn"));
			await waitFor(() => {
				// CLEAR_QUEUE keeps current track in queue (queue length = 1 if track is playing)
				expect(screen.getByTestId("queue-length")).toHaveTextContent("1");
				// Current track is preserved
				expect(screen.getByTestId("current-track")).toHaveTextContent("Track track-1");
			});
		});

		it("should throw error when usePlayer is used outside provider", () => {
			// Suppress console.error for this test
			const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

			expect(() => {
				render(<PlayerControlTester />);
			}).toThrow("usePlayer must be used within a PlayerProvider");

			consoleSpy.mockRestore();
		});
	});
});
