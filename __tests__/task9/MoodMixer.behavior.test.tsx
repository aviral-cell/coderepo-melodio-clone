// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import MoodMixerPage from "@/pages/MoodMixerPage";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// ========== MOCKS ==========

jest.mock("@/shared/services", () => ({
	tracksService: {
		getAll: jest.fn(),
	},
}));

jest.mock("@/shared/contexts/AuthContext", () => ({
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
	useAuth: () => ({
		user: { _id: "user-1", email: "test@melodio.com", name: "Test User" },
		isAuthenticated: true,
		isLoading: false,
		login: jest.fn(),
		register: jest.fn(),
		logout: jest.fn(),
	}),
}));

jest.mock("@/shared/contexts/SidebarContext", () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
	useSidebar: () => ({
		isMobileSidebarOpen: false,
		toggleMobileSidebar: jest.fn(),
		closeMobileSidebar: jest.fn(),
	}),
}));

jest.mock("@/lib/utils", () => ({
	cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/shared/utils", () => ({
	cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
	formatDuration: (seconds: number) => {
		const totalSeconds = Math.floor(seconds);
		const minutes = Math.floor(totalSeconds / 60);
		const remainingSeconds = totalSeconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	},
	normalizeTracks: (tracks: any[]) => tracks,
	normalizeTrack: (track: any) => track,
	formatNumber: (num: number) => new Intl.NumberFormat("en-US").format(num),
	formatDate: (date: any) => {
		const d = typeof date === "string" ? new Date(date) : date;
		return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
	},
	capitalize: (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str),
	truncate: (text: string, maxLength: number) => (text.length <= maxLength ? text : text.slice(0, maxLength - 3) + "..."),
	isEmpty: (value: any) => value === null || value === undefined || (typeof value === "string" && value.trim() === ""),
	getInitials: (name: string) => name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
	DEFAULT_IMAGE: "/melodio.svg",
	getImageUrl: (path: any) => path || "/melodio.svg",
	preloadImages: jest.fn(),
	debounce: (func: any, wait: number) => func,
	generateId: () => Math.random().toString(36).substring(2, 11),
	sleep: (ms: number) => new Promise((resolve: any) => setTimeout(resolve, ms)),
}));

// ========== FACTORY FUNCTIONS ==========

function createMockTrack(overrides: Record<string, unknown> = {}) {
	return {
		_id: `track-${Math.random().toString(36).substring(2, 9)}`,
		title: "Test Track",
		durationInSeconds: 200,
		trackNumber: 1,
		genre: "rock",
		playCount: 1000,
		createdAt: "2024-01-20T00:00:00.000Z",
		updatedAt: "2024-01-20T00:00:00.000Z",
		coverImageUrl: "/cover.jpg",
		artistId: {
			_id: "artist-1",
			name: "Test Artist",
			imageUrl: "/artist.jpg",
		},
		albumId: {
			_id: "album-1",
			title: "Test Album",
			coverImageUrl: "/cover.jpg",
		},
		...overrides,
	};
}

// ========== MOCK DATA ==========

const rockTracks = [
	createMockTrack({
		_id: "track-rock-1",
		title: "Thunder Road",
		genre: "rock",
		durationInSeconds: 210,
		trackNumber: 1,
		playCount: 5000,
		artistId: { _id: "artist-rock-1", name: "The Amplifiers", imageUrl: "/artist-rock.jpg" },
		albumId: { _id: "album-rock-1", title: "Electric Storm", coverImageUrl: "/cover-rock.jpg" },
	}),
	createMockTrack({
		_id: "track-rock-2",
		title: "Lightning Strike",
		genre: "rock",
		durationInSeconds: 195,
		trackNumber: 2,
		playCount: 4500,
		artistId: { _id: "artist-rock-1", name: "The Amplifiers", imageUrl: "/artist-rock.jpg" },
		albumId: { _id: "album-rock-1", title: "Electric Storm", coverImageUrl: "/cover-rock.jpg" },
	}),
];

const popTracks = [
	createMockTrack({
		_id: "track-pop-1",
		title: "Dancing in the Moonlight",
		genre: "pop",
		durationInSeconds: 230,
		trackNumber: 1,
		playCount: 8000,
		artistId: { _id: "artist-pop-1", name: "Neon Dreams", imageUrl: "/artist-pop.jpg" },
		albumId: { _id: "album-pop-1", title: "Neon Nights", coverImageUrl: "/cover-pop.jpg" },
	}),
	createMockTrack({
		_id: "track-pop-2",
		title: "Summer Nights",
		genre: "pop",
		durationInSeconds: 215,
		trackNumber: 2,
		playCount: 7500,
		artistId: { _id: "artist-pop-1", name: "Neon Dreams", imageUrl: "/artist-pop.jpg" },
		albumId: { _id: "album-pop-1", title: "Neon Nights", coverImageUrl: "/cover-pop.jpg" },
	}),
];

const jazzTracks = [
	createMockTrack({
		_id: "track-jazz-1",
		title: "Blue Velvet",
		genre: "jazz",
		durationInSeconds: 300,
		trackNumber: 1,
		playCount: 3000,
		artistId: { _id: "artist-jazz-1", name: "Blue Note Quartet", imageUrl: "/artist-jazz.jpg" },
		albumId: { _id: "album-jazz-1", title: "Midnight Sessions", coverImageUrl: "/cover-jazz.jpg" },
	}),
	createMockTrack({
		_id: "track-jazz-2",
		title: "Smooth Operator",
		genre: "jazz",
		durationInSeconds: 280,
		trackNumber: 2,
		playCount: 2800,
		artistId: { _id: "artist-jazz-1", name: "Blue Note Quartet", imageUrl: "/artist-jazz.jpg" },
		albumId: { _id: "album-jazz-1", title: "Midnight Sessions", coverImageUrl: "/cover-jazz.jpg" },
	}),
];

const electronicTracks = [
	createMockTrack({
		_id: "track-electronic-1",
		title: "Neon City",
		genre: "electronic",
		durationInSeconds: 240,
		trackNumber: 1,
		playCount: 6000,
		artistId: { _id: "artist-electronic-1", name: "Synthwave Collective", imageUrl: "/artist-electronic.jpg" },
		albumId: { _id: "album-electronic-1", title: "Digital Horizon", coverImageUrl: "/cover-electronic.jpg" },
	}),
	createMockTrack({
		_id: "track-electronic-2",
		title: "Cyber Drive",
		genre: "electronic",
		durationInSeconds: 220,
		trackNumber: 2,
		playCount: 5500,
		artistId: { _id: "artist-electronic-1", name: "Synthwave Collective", imageUrl: "/artist-electronic.jpg" },
		albumId: { _id: "album-electronic-1", title: "Digital Horizon", coverImageUrl: "/cover-electronic.jpg" },
	}),
];

const hipHopTracks = [
	createMockTrack({
		_id: "track-hiphop-1",
		title: "Block Party",
		genre: "hip-hop",
		durationInSeconds: 250,
		trackNumber: 1,
		playCount: 7000,
		artistId: { _id: "artist-hiphop-1", name: "Urban Beats", imageUrl: "/artist-hiphop.jpg" },
		albumId: { _id: "album-hiphop-1", title: "Street Anthems", coverImageUrl: "/cover-hiphop.jpg" },
	}),
	createMockTrack({
		_id: "track-hiphop-2",
		title: "Concrete Jungle",
		genre: "hip-hop",
		durationInSeconds: 235,
		trackNumber: 2,
		playCount: 6500,
		artistId: { _id: "artist-hiphop-1", name: "Urban Beats", imageUrl: "/artist-hiphop.jpg" },
		albumId: { _id: "album-hiphop-1", title: "Street Anthems", coverImageUrl: "/cover-hiphop.jpg" },
	}),
];

const allMockTracks = [
	...rockTracks,
	...popTracks,
	...jazzTracks,
	...electronicTracks,
	...hipHopTracks,
];

const mockTracksResponse = {
	items: allMockTracks,
	total: allMockTracks.length,
	page: 1,
	limit: 50,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

const ALL_MOOD_HEADINGS = ["Energetic", "Chill", "Happy", "Focus", "Party"];

// ========== TEST WRAPPER ==========

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={["/mood"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>{children}</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderMoodMixerPage() {
	return render(
		<TestWrapper>
			<MoodMixerPage />
		</TestWrapper>,
	);
}

// ========== SETUP / TEARDOWN ==========

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

import { tracksService } from "@/shared/services";

const mockGetAll = tracksService.getAll as jest.Mock;

describe("Mood Mixer", () => {
	beforeAll(() => {
		delete window.location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/",
			search: "",
			hash: "",
			href: "http://localhost:3000/",
			origin: "http://localhost:3000",
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Track Display", () => {
		it("should display all mood sections by default", async () => {
			mockGetAll.mockResolvedValue(mockTracksResponse);

			// Render mood mixer page
			renderMoodMixerPage();

			// Wait for tracks to load
			await waitFor(() => {
				expect(screen.getByTestId("mood-tracks")).toBeInTheDocument();
			});

			// Verify all 16 tracks displayed
			const tracksContainer = screen.getByTestId("mood-tracks");
			const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
			expect(trackItems).toHaveLength(16);

			// Verify all mood section headings present
			for (const heading of ALL_MOOD_HEADINGS) {
				expect(within(tracksContainer).getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
			}

			// Verify no mood description shown
			expect(screen.queryByTestId("mood-description")).not.toBeInTheDocument();
		});
	});

	describe("Mood Filtering", () => {
		it.each([
			["energetic", 4, "High-energy tracks to get you moving", "Energetic"],
			["chill", 2, "Relaxing vibes to unwind", "Chill"],
			["happy", 2, "Feel-good tunes to brighten your day", "Happy"],
			["focus", 4, "Instrumental beats to help you concentrate", "Focus"],
			["party", 4, "Bangers to get the party started", "Party"],
		])("should filter tracks when %s mood is selected", async (chipId, trackCount, description, heading) => {
			const user = userEvent.setup();
			mockGetAll.mockResolvedValue(mockTracksResponse);

			// Render mood mixer page
			renderMoodMixerPage();

			// Wait for mood chips to load
			await waitFor(() => {
				expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
			});

			// Click mood chip
			await user.click(screen.getByTestId(`mood-chip-${chipId}`));

			// Verify filtered track count
			await waitFor(() => {
				const tracksContainer = screen.getByTestId("mood-tracks");
				const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
				expect(trackItems).toHaveLength(trackCount);
			});

			// Verify mood description displayed
			expect(screen.getByTestId("mood-description")).toHaveTextContent(description);

			// Verify only selected mood heading shown
			const tracksContainer = screen.getByTestId("mood-tracks");
			expect(within(tracksContainer).getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
			for (const h of ALL_MOOD_HEADINGS.filter((m) => m !== heading)) {
				expect(within(tracksContainer).queryByRole("heading", { name: h, level: 2 })).not.toBeInTheDocument();
			}
		});
	});

	describe("Mood Toggle", () => {
		it("should deselect mood and show all sections", async () => {
			const user = userEvent.setup();
			mockGetAll.mockResolvedValue(mockTracksResponse);

			// Render mood mixer page
			renderMoodMixerPage();

			// Wait for mood chips to load
			await waitFor(() => {
				expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
			});

			// Select energetic mood
			await user.click(screen.getByTestId("mood-chip-energetic"));

			// Verify filtered to 4 tracks
			await waitFor(() => {
				const tracksContainer = screen.getByTestId("mood-tracks");
				const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
				expect(trackItems).toHaveLength(4);
			});

			// Deselect energetic mood
			await user.click(screen.getByTestId("mood-chip-energetic"));

			// Verify all 16 tracks restored
			await waitFor(() => {
				const tracksContainer = screen.getByTestId("mood-tracks");
				const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
				expect(trackItems).toHaveLength(16);
			});

			// Verify all mood headings restored
			const tracksContainer = screen.getByTestId("mood-tracks");
			for (const heading of ALL_MOOD_HEADINGS) {
				expect(within(tracksContainer).getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
			}

			// Verify no mood description shown
			expect(screen.queryByTestId("mood-description")).not.toBeInTheDocument();
		});

		it("should switch between moods", async () => {
			const user = userEvent.setup();
			mockGetAll.mockResolvedValue(mockTracksResponse);

			// Render mood mixer page
			renderMoodMixerPage();

			// Wait for mood chips to load
			await waitFor(() => {
				expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
			});

			// Select happy mood
			await user.click(screen.getByTestId("mood-chip-happy"));

			// Verify 2 happy tracks shown
			await waitFor(() => {
				const tracksContainer = screen.getByTestId("mood-tracks");
				const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
				expect(trackItems).toHaveLength(2);
			});

			// Verify happy description
			expect(screen.getByTestId("mood-description")).toHaveTextContent("Feel-good tunes to brighten your day");

			// Switch to party mood
			await user.click(screen.getByTestId("mood-chip-party"));

			// Verify 4 party tracks shown
			await waitFor(() => {
				const tracksContainer = screen.getByTestId("mood-tracks");
				const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
				expect(trackItems).toHaveLength(4);
			});

			// Verify party description
			expect(screen.getByTestId("mood-description")).toHaveTextContent("Bangers to get the party started");
		});
	});
});
