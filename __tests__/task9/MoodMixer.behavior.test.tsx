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
		user: { _id: "user-1", email: "test@hackerrank.com", name: "Test User" },
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

// Rock tracks (2)
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

// Pop tracks (2)
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

// Jazz tracks (2)
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

// Electronic tracks (2)
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

// Hip-hop tracks (2)
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

// Mood headings expected in the page (capitalized mood names)
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

	// ========== TRACK DISPLAY ==========

	describe("Track Display", () => {
		describe("All Mood Sections", () => {
			it("should display all mood sections when no mood is selected", async () => {
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-tracks")).toBeInTheDocument();
				});

				// With per-mood carousels, tracks appear in multiple sections due to shared genres:
				// Energetic [rock, electronic] = 4, Chill [jazz] = 2, Happy [pop] = 2,
				// Focus [electronic, jazz] = 4, Party [pop, hip-hop] = 4 => total 16
				const tracksContainer = screen.getByTestId("mood-tracks");
				const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
				expect(trackItems).toHaveLength(16);

				// All 5 mood section headings should be visible
				for (const heading of ALL_MOOD_HEADINGS) {
					expect(within(tracksContainer).getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
				}

				// Mood description should NOT be visible when no mood selected
				expect(screen.queryByTestId("mood-description")).not.toBeInTheDocument();
			});
		});

	});

	// ========== MOOD FILTERING ==========

	describe("Mood Filtering", () => {
		describe("Energetic Mood", () => {
			it("should filter to Energetic section when selected", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Energetic chip
				await user.click(screen.getByTestId("mood-chip-energetic"));

				// Energetic = rock + electronic = 4 tracks
				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(4);
				});

				// Verify description is shown
				expect(screen.getByTestId("mood-description")).toHaveTextContent("High-energy tracks to get you moving");

				// Only Energetic heading should be visible
				const tracksContainer = screen.getByTestId("mood-tracks");
				expect(within(tracksContainer).getByRole("heading", { name: "Energetic", level: 2 })).toBeInTheDocument();
				for (const heading of ALL_MOOD_HEADINGS.filter((h) => h !== "Energetic")) {
					expect(within(tracksContainer).queryByRole("heading", { name: heading, level: 2 })).not.toBeInTheDocument();
				}
			});
		});

		describe("Chill Mood", () => {
			it("should filter to Chill section when selected", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Chill chip
				await user.click(screen.getByTestId("mood-chip-chill"));

				// Chill = jazz = 2 tracks
				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(2);
				});

				// Verify description
				expect(screen.getByTestId("mood-description")).toHaveTextContent("Relaxing vibes to unwind");

				// Only Chill heading should be visible
				const tracksContainer = screen.getByTestId("mood-tracks");
				expect(within(tracksContainer).getByRole("heading", { name: "Chill", level: 2 })).toBeInTheDocument();
				for (const heading of ALL_MOOD_HEADINGS.filter((h) => h !== "Chill")) {
					expect(within(tracksContainer).queryByRole("heading", { name: heading, level: 2 })).not.toBeInTheDocument();
				}
			});
		});

		describe("Happy Mood", () => {
			it("should filter to Happy section when selected", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Happy chip
				await user.click(screen.getByTestId("mood-chip-happy"));

				// Happy = pop = 2 tracks
				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(2);
				});

				// Verify description
				expect(screen.getByTestId("mood-description")).toHaveTextContent("Feel-good tunes to brighten your day");

				// Only Happy heading should be visible
				const tracksContainer = screen.getByTestId("mood-tracks");
				expect(within(tracksContainer).getByRole("heading", { name: "Happy", level: 2 })).toBeInTheDocument();
				for (const heading of ALL_MOOD_HEADINGS.filter((h) => h !== "Happy")) {
					expect(within(tracksContainer).queryByRole("heading", { name: heading, level: 2 })).not.toBeInTheDocument();
				}
			});
		});

		describe("Focus Mood", () => {
			it("should filter to Focus section when selected", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Focus chip
				await user.click(screen.getByTestId("mood-chip-focus"));

				// Focus = electronic + jazz = 4 tracks
				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(4);
				});

				// Verify description
				expect(screen.getByTestId("mood-description")).toHaveTextContent("Instrumental beats to help you concentrate");

				// Only Focus heading should be visible
				const tracksContainer = screen.getByTestId("mood-tracks");
				expect(within(tracksContainer).getByRole("heading", { name: "Focus", level: 2 })).toBeInTheDocument();
				for (const heading of ALL_MOOD_HEADINGS.filter((h) => h !== "Focus")) {
					expect(within(tracksContainer).queryByRole("heading", { name: heading, level: 2 })).not.toBeInTheDocument();
				}
			});
		});

		describe("Party Mood", () => {
			it("should filter to Party section when selected", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Party chip
				await user.click(screen.getByTestId("mood-chip-party"));

				// Party = pop + hip-hop = 4 tracks
				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(4);
				});

				// Verify description
				expect(screen.getByTestId("mood-description")).toHaveTextContent("Bangers to get the party started");

				// Only Party heading should be visible
				const tracksContainer = screen.getByTestId("mood-tracks");
				expect(within(tracksContainer).getByRole("heading", { name: "Party", level: 2 })).toBeInTheDocument();
				for (const heading of ALL_MOOD_HEADINGS.filter((h) => h !== "Party")) {
					expect(within(tracksContainer).queryByRole("heading", { name: heading, level: 2 })).not.toBeInTheDocument();
				}
			});
		});
	});

	// ========== MOOD TOGGLE ==========

	describe("Mood Toggle", () => {
		describe("Deselect Mood", () => {
			it("should deselect mood and show all sections when clicking same chip again", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Energetic chip to select
				await user.click(screen.getByTestId("mood-chip-energetic"));

				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(4);
				});

				// Click Energetic chip again to deselect
				await user.click(screen.getByTestId("mood-chip-energetic"));

				// All 16 track elements should be visible again (across all mood sections)
				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(16);
				});

				// All 5 mood headings should be visible
				const tracksContainer = screen.getByTestId("mood-tracks");
				for (const heading of ALL_MOOD_HEADINGS) {
					expect(within(tracksContainer).getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
				}

				// Description should disappear
				expect(screen.queryByTestId("mood-description")).not.toBeInTheDocument();
			});
		});

		describe("Switch Between Moods", () => {
			it("should switch between moods correctly", async () => {
				const user = userEvent.setup();
				mockGetAll.mockResolvedValue(mockTracksResponse);

				renderMoodMixerPage();

				await waitFor(() => {
					expect(screen.getByTestId("mood-chips")).toBeInTheDocument();
				});

				// Click Happy chip first -> 2 tracks (pop)
				await user.click(screen.getByTestId("mood-chip-happy"));

				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(2);
				});

				expect(screen.getByTestId("mood-description")).toHaveTextContent("Feel-good tunes to brighten your day");

				// Click Party chip -> 4 tracks (pop + hip-hop)
				await user.click(screen.getByTestId("mood-chip-party"));

				await waitFor(() => {
					const tracksContainer = screen.getByTestId("mood-tracks");
					const trackItems = within(tracksContainer).getAllByTestId(/^mood-track-/);
					expect(trackItems).toHaveLength(4);
				});

				// Verify description changed to Party
				expect(screen.getByTestId("mood-description")).toHaveTextContent("Bangers to get the party started");
			});
		});
	});

});
