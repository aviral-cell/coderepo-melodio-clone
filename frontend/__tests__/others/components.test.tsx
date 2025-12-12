/**
 * @jest-environment jsdom
 */

/**
 * Phase 4.4: Post-Implementation Component Tests - Components
 *
 * Tests for common components: TrackCard interactions
 *
 * SCENARIO: TrackCard has two distinct click behaviors:
 * 1. Play/Pause button click - plays/pauses track (no navigation)
 * 2. Card click - navigates to track detail page
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";

// Mock react-router navigation
const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
	...jest.requireActual("react-router"),
	useNavigate: () => mockNavigate,
}));

// Import after mocks
import { TrackCard } from "@/shared/components/common/TrackCard";
import { PlayerProvider, usePlayer } from "@/shared/contexts/PlayerContext";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const createMockTrack = (id: string, title?: string): TrackWithPopulated => ({
	_id: id,
	title: title || `Track ${id}`,
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

// Helper to access player state
function PlayerStateTester() {
	const { state } = usePlayer();
	return (
		<div>
			<span data-testid="current-track-id">{state.currentTrack?._id || "none"}</span>
			<span data-testid="is-playing">{state.isPlaying ? "true" : "false"}</span>
		</div>
	);
}

const renderTrackCard = (track: TrackWithPopulated) => {
	return render(
		<MemoryRouter>
			<PlayerProvider>
				<TrackCard track={track} />
				<PlayerStateTester />
			</PlayerProvider>
		</MemoryRouter>
	);
};

describe("TrackCard Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Display", () => {
		it("should render track title", () => {
			const track = createMockTrack("1", "Thunder");
			renderTrackCard(track);

			expect(screen.getByText("Thunder")).toBeInTheDocument();
		});

		it("should render artist name", () => {
			const track = createMockTrack("1");
			renderTrackCard(track);

			expect(screen.getByText("Test Artist")).toBeInTheDocument();
		});

		it("should render formatted duration", () => {
			const track = createMockTrack("1");
			renderTrackCard(track);

			expect(screen.getByText("3:00")).toBeInTheDocument();
		});

		it("should render album cover image", () => {
			const track = createMockTrack("1", "Thunder");
			renderTrackCard(track);

			const img = screen.getByAltText("Thunder");
			expect(img).toHaveAttribute("src", "http://example.com/album.jpg");
		});
	});

	describe("Play Button Interactions", () => {
		it("should play track when play button is clicked", async () => {
			const track = createMockTrack("track-1", "Play Test");
			renderTrackCard(track);

			// Find the play button
			const playButton = screen.getByRole("button", { name: "Play" });

			// Click play button
			fireEvent.click(playButton);

			// Verify track is now playing
			await waitFor(() => {
				expect(screen.getByTestId("current-track-id")).toHaveTextContent("track-1");
				expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
			});

			// Verify NO navigation occurred
			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it("should toggle pause when play button clicked on currently playing track", async () => {
			const track = createMockTrack("track-1", "Toggle Test");
			renderTrackCard(track);

			const playButton = screen.getByRole("button", { name: "Play" });

			// Click to start playing
			fireEvent.click(playButton);

			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
			});

			// Now click again to pause
			const pauseButton = screen.getByRole("button", { name: "Pause" });
			fireEvent.click(pauseButton);

			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("false");
			});

			// Still no navigation
			expect(mockNavigate).not.toHaveBeenCalled();
		});
	});

	describe("Card Click Navigation", () => {
		it("should navigate to track detail page when card is clicked", async () => {
			const track = createMockTrack("track-nav-1", "Navigate Test");
			renderTrackCard(track);

			// Find the card container (role="button" with track title)
			const trackCard = screen.getByRole("button", { name: /Navigate Test/i });

			// Click the card (not the play button)
			fireEvent.click(trackCard);

			// Verify navigation occurred
			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith("/track/track-nav-1");
			});
		});

		it("should navigate with keyboard Enter key", async () => {
			const track = createMockTrack("track-kbd-1", "Keyboard Nav");
			renderTrackCard(track);

			const trackCard = screen.getByRole("button", { name: /Keyboard Nav/i });

			// Simulate Enter key press
			fireEvent.keyDown(trackCard, { key: "Enter" });

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith("/track/track-kbd-1");
			});
		});

		it("should navigate with keyboard Space key", async () => {
			const track = createMockTrack("track-space-1", "Space Nav");
			renderTrackCard(track);

			const trackCard = screen.getByRole("button", { name: /Space Nav/i });

			// Simulate Space key press
			fireEvent.keyDown(trackCard, { key: " " });

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith("/track/track-space-1");
			});
		});
	});

	describe("Click Event Isolation", () => {
		it("should NOT navigate when play button is clicked (event should stop propagation)", async () => {
			const track = createMockTrack("track-iso-1", "Isolation Test");
			renderTrackCard(track);

			// Click the play button specifically
			const playButton = screen.getByRole("button", { name: "Play" });
			fireEvent.click(playButton);

			// Play should work
			await waitFor(() => {
				expect(screen.getByTestId("current-track-id")).toHaveTextContent("track-iso-1");
			});

			// But navigation should NOT occur
			expect(mockNavigate).not.toHaveBeenCalled();
		});
	});

	describe("Current Track Indicator", () => {
		it("should show pause icon when track is currently playing", async () => {
			const track = createMockTrack("current-1", "Currently Playing");
			renderTrackCard(track);

			// Start playing
			const playButton = screen.getByRole("button", { name: "Play" });
			fireEvent.click(playButton);

			await waitFor(() => {
				expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
			});

			// Button should now show Pause
			expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
		});
	});
});
