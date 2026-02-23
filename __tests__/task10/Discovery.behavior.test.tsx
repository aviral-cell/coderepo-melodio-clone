// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";

import DiscoveryPage from "@/pages/DiscoveryPage";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// ========== MOCKS ==========

jest.mock("@/shared/services", () => ({
	tracksService: {
		getAll: jest.fn(),
	},
	albumsService: {
		getAll: jest.fn(),
	},
	artistsService: {
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
	getInitials: (name: string) =>
		name
			.split(" ")
			.map((w: string) => w[0])
			.join("")
			.toUpperCase()
			.slice(0, 2),
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
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
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

function createMockAlbum(overrides: Record<string, unknown> = {}) {
	return {
		_id: `album-${Math.random().toString(36).substring(2, 9)}`,
		title: "Test Album",
		releaseDate: "2023-01-01T00:00:00.000Z",
		coverImageUrl: "/cover.jpg",
		totalTracks: 5,
		createdAt: "2023-01-01T00:00:00.000Z",
		updatedAt: "2023-01-01T00:00:00.000Z",
		artistId: { _id: "artist-1", name: "Test Artist", imageUrl: "/artist.jpg" },
		...overrides,
	};
}

function createMockArtist(overrides: Record<string, unknown> = {}) {
	return {
		_id: `artist-${Math.random().toString(36).substring(2, 9)}`,
		name: "Test Artist",
		bio: "Test bio",
		imageUrl: "/artist.jpg",
		genres: ["rock"],
		followerCount: 50000,
		createdAt: "2023-01-01T00:00:00.000Z",
		updatedAt: "2023-01-01T00:00:00.000Z",
		...overrides,
	};
}

// ========== MOCK DATA ==========

const now = new Date().toISOString();

// Rock tracks (2) - linked to album-rock-1 (2012, "2010's" era)
const rockTracks = [
	createMockTrack({
		_id: "track-rock-1",
		title: "Thunder Road",
		genre: "rock",
		durationInSeconds: 210,
		trackNumber: 1,
		playCount: 5000,
		createdAt: now,
		updatedAt: now,
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
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-rock-1", name: "The Amplifiers", imageUrl: "/artist-rock.jpg" },
		albumId: { _id: "album-rock-1", title: "Electric Storm", coverImageUrl: "/cover-rock.jpg" },
	}),
];

// Pop tracks (2) - linked to album-pop-1 (2015, "2010's" era)
const popTracks = [
	createMockTrack({
		_id: "track-pop-1",
		title: "Dancing in the Moonlight",
		genre: "pop",
		durationInSeconds: 230,
		trackNumber: 1,
		playCount: 8000,
		createdAt: now,
		updatedAt: now,
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
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-pop-1", name: "Neon Dreams", imageUrl: "/artist-pop.jpg" },
		albumId: { _id: "album-pop-1", title: "Neon Nights", coverImageUrl: "/cover-pop.jpg" },
	}),
];

// Jazz tracks (2) - linked to album-jazz-1 (1995, "90's" era)
const jazzTracks = [
	createMockTrack({
		_id: "track-jazz-1",
		title: "Blue Velvet",
		genre: "jazz",
		durationInSeconds: 300,
		trackNumber: 1,
		playCount: 3000,
		createdAt: now,
		updatedAt: now,
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
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-jazz-1", name: "Blue Note Quartet", imageUrl: "/artist-jazz.jpg" },
		albumId: { _id: "album-jazz-1", title: "Midnight Sessions", coverImageUrl: "/cover-jazz.jpg" },
	}),
];

// Electronic tracks (2) - linked to album-electronic-1 (2003, "2000's" era)
const electronicTracks = [
	createMockTrack({
		_id: "track-electronic-1",
		title: "Neon City",
		genre: "electronic",
		durationInSeconds: 240,
		trackNumber: 1,
		playCount: 6000,
		createdAt: now,
		updatedAt: now,
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
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-electronic-1", name: "Synthwave Collective", imageUrl: "/artist-electronic.jpg" },
		albumId: { _id: "album-electronic-1", title: "Digital Horizon", coverImageUrl: "/cover-electronic.jpg" },
	}),
];

// Hip-hop tracks (2) - linked to album-hiphop-1 (2023, "2020's" era)
const hipHopTracks = [
	createMockTrack({
		_id: "track-hiphop-1",
		title: "Block Party",
		genre: "hip-hop",
		durationInSeconds: 250,
		trackNumber: 1,
		playCount: 7000,
		createdAt: now,
		updatedAt: now,
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
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-hiphop-1", name: "Urban Beats", imageUrl: "/artist-hiphop.jpg" },
		albumId: { _id: "album-hiphop-1", title: "Street Anthems", coverImageUrl: "/cover-hiphop.jpg" },
	}),
];

// R&B tracks (2) - linked to album-rnb-1 (1998, "90's" era)
const rnbTracks = [
	createMockTrack({
		_id: "track-rnb-1",
		title: "Slow Groove",
		genre: "r-and-b",
		durationInSeconds: 260,
		trackNumber: 1,
		playCount: 4000,
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-rnb-1", name: "Velvet Voice", imageUrl: "/artist-rnb.jpg" },
		albumId: { _id: "album-rnb-1", title: "Satin Sheets", coverImageUrl: "/cover-rnb.jpg" },
	}),
	createMockTrack({
		_id: "track-rnb-2",
		title: "Midnight Love",
		genre: "r-and-b",
		durationInSeconds: 245,
		trackNumber: 2,
		playCount: 3800,
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-rnb-1", name: "Velvet Voice", imageUrl: "/artist-rnb.jpg" },
		albumId: { _id: "album-rnb-1", title: "Satin Sheets", coverImageUrl: "/cover-rnb.jpg" },
	}),
];

// Classical tracks (2) - linked to album-classical-1 (1985, "80's" era)
const classicalTracks = [
	createMockTrack({
		_id: "track-classical-1",
		title: "Symphony No. 5",
		genre: "classical",
		durationInSeconds: 400,
		trackNumber: 1,
		playCount: 2000,
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-classical-1", name: "Vienna Philharmonic", imageUrl: "/artist-classical.jpg" },
		albumId: { _id: "album-classical-1", title: "Timeless Classics", coverImageUrl: "/cover-classical.jpg" },
	}),
	createMockTrack({
		_id: "track-classical-2",
		title: "Moonlight Sonata",
		genre: "classical",
		durationInSeconds: 350,
		trackNumber: 2,
		playCount: 1800,
		createdAt: now,
		updatedAt: now,
		artistId: { _id: "artist-classical-1", name: "Vienna Philharmonic", imageUrl: "/artist-classical.jpg" },
		albumId: { _id: "album-classical-1", title: "Timeless Classics", coverImageUrl: "/cover-classical.jpg" },
	}),
];

const allMockTracks = [
	...rockTracks,
	...popTracks,
	...jazzTracks,
	...electronicTracks,
	...hipHopTracks,
	...rnbTracks,
	...classicalTracks,
];

// Albums with matching _id values and specific releaseDates for era testing
const allMockAlbums = [
	createMockAlbum({
		_id: "album-rock-1",
		title: "Electric Storm",
		releaseDate: "2012-06-15T00:00:00.000Z",
		artistId: { _id: "artist-rock-1", name: "The Amplifiers", imageUrl: "/artist-rock.jpg" },
	}),
	createMockAlbum({
		_id: "album-pop-1",
		title: "Neon Nights",
		releaseDate: "2015-03-20T00:00:00.000Z",
		artistId: { _id: "artist-pop-1", name: "Neon Dreams", imageUrl: "/artist-pop.jpg" },
	}),
	createMockAlbum({
		_id: "album-jazz-1",
		title: "Midnight Sessions",
		releaseDate: "1995-11-10T00:00:00.000Z",
		artistId: { _id: "artist-jazz-1", name: "Blue Note Quartet", imageUrl: "/artist-jazz.jpg" },
	}),
	createMockAlbum({
		_id: "album-electronic-1",
		title: "Digital Horizon",
		releaseDate: "2003-08-25T00:00:00.000Z",
		artistId: { _id: "artist-electronic-1", name: "Synthwave Collective", imageUrl: "/artist-electronic.jpg" },
	}),
	createMockAlbum({
		_id: "album-hiphop-1",
		title: "Street Anthems",
		releaseDate: "2023-01-15T00:00:00.000Z",
		artistId: { _id: "artist-hiphop-1", name: "Urban Beats", imageUrl: "/artist-hiphop.jpg" },
	}),
	createMockAlbum({
		_id: "album-rnb-1",
		title: "Satin Sheets",
		releaseDate: "1998-07-04T00:00:00.000Z",
		artistId: { _id: "artist-rnb-1", name: "Velvet Voice", imageUrl: "/artist-rnb.jpg" },
	}),
	createMockAlbum({
		_id: "album-classical-1",
		title: "Timeless Classics",
		releaseDate: "1985-04-12T00:00:00.000Z",
		artistId: { _id: "artist-classical-1", name: "Vienna Philharmonic", imageUrl: "/artist-classical.jpg" },
	}),
];

// Artists with different followerCounts for Top Artists ordering
const allMockArtists = [
	createMockArtist({
		_id: "artist-pop-1",
		name: "Neon Dreams",
		genres: ["pop"],
		followerCount: 500000,
	}),
	createMockArtist({
		_id: "artist-hiphop-1",
		name: "Urban Beats",
		genres: ["hip-hop"],
		followerCount: 400000,
	}),
	createMockArtist({
		_id: "artist-electronic-1",
		name: "Synthwave Collective",
		genres: ["electronic"],
		followerCount: 300000,
	}),
	createMockArtist({
		_id: "artist-rock-1",
		name: "The Amplifiers",
		genres: ["rock"],
		followerCount: 250000,
	}),
	createMockArtist({
		_id: "artist-rnb-1",
		name: "Velvet Voice",
		genres: ["r-and-b"],
		followerCount: 200000,
	}),
	createMockArtist({
		_id: "artist-jazz-1",
		name: "Blue Note Quartet",
		genres: ["jazz"],
		followerCount: 150000,
	}),
	createMockArtist({
		_id: "artist-classical-1",
		name: "Vienna Philharmonic",
		genres: ["classical"],
		followerCount: 100000,
	}),
];

// Paginated responses matching backend shape
const mockTracksResponse = {
	items: allMockTracks,
	total: allMockTracks.length,
	page: 1,
	limit: 100,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

const mockAlbumsResponse = {
	items: allMockAlbums,
	total: allMockAlbums.length,
	page: 1,
	limit: 100,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

const mockArtistsResponse = {
	items: allMockArtists,
	total: allMockArtists.length,
	page: 1,
	limit: 100,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

// ========== TEST WRAPPER ==========

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={["/discover"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>{children}</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderDiscoveryPage() {
	return render(
		<TestWrapper>
			<DiscoveryPage />
		</TestWrapper>,
	);
}

function LocationDisplay() {
	const location = useLocation();
	return <div data-testid="location-display">{location.pathname}</div>;
}

function renderDiscoveryPageWithLocation() {
	return render(
		<MemoryRouter initialEntries={["/discover"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>
						<DiscoveryPage />
						<LocationDisplay />
					</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>,
	);
}

// ========== SETUP / TEARDOWN ==========

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

import { tracksService, albumsService, artistsService } from "@/shared/services";

const mockTracksGetAll = tracksService.getAll as jest.Mock;
const mockAlbumsGetAll = albumsService.getAll as jest.Mock;
const mockArtistsGetAll = artistsService.getAll as jest.Mock;

function setupSuccessfulMocks() {
	mockTracksGetAll.mockResolvedValue(mockTracksResponse);
	mockAlbumsGetAll.mockResolvedValue(mockAlbumsResponse);
	mockArtistsGetAll.mockResolvedValue(mockArtistsResponse);
}

describe("Music Discovery", () => {
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

	// ========== PAGE LOADING ==========

	describe("Page Loading", () => {
		describe("Error State", () => {
			it("should show error state when API fails", async () => {
				mockTracksGetAll.mockRejectedValue(new Error("Network error"));
				mockAlbumsGetAll.mockRejectedValue(new Error("Network error"));
				mockArtistsGetAll.mockRejectedValue(new Error("Network error"));

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-error")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("discovery-loading")).not.toBeInTheDocument();
				expect(screen.queryByTestId("discovery-new-this-week")).not.toBeInTheDocument();
			});
		});

	});

	// ========== NEW THIS WEEK ==========

	describe("New This Week", () => {
		describe("Track Display", () => {
			it("should display tracks in New This Week section", async () => {
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-new-this-week")).toBeInTheDocument();
				});

				// All tracks have createdAt set to "now", so they should all appear in New This Week
				const newThisWeekSection = screen.getByTestId("discovery-new-this-week");
				const trackElements = within(newThisWeekSection).getAllByTestId(/^discovery-new-track-/);
				expect(trackElements.length).toBe(allMockTracks.length);
			});
		});
	});

	// ========== LANGUAGE FILTERING ==========

	describe("Language Filtering", () => {
		describe("Language Chips Display", () => {
			it("should display language filter chips", async () => {
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-popular-language")).toBeInTheDocument();
				});

				// Verify the language chips container exists
				expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();

				// Verify each language chip is present (lowercased in data-testid)
				const expectedLanguages = ["english", "korean", "french", "german", "spanish", "chinese"];
				for (const lang of expectedLanguages) {
					expect(screen.getByTestId(`discovery-language-chip-${lang}`)).toBeInTheDocument();
				}
			});
		});

		describe("Language Selection", () => {
			it("should filter tracks when a language chip is selected", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
				});

				// Click "Korean" chip -- Korean maps to "pop" genre (2 pop tracks)
				await user.click(screen.getByTestId("discovery-language-chip-korean"));

				// Heading should change to "Popular in Korean"
				const languageSection = screen.getByTestId("discovery-popular-language");
				await waitFor(() => {
					expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Korean");
				});

				// Should show only the 2 pop tracks (Korean maps to pop)
				const languageTracks = within(languageSection).getAllByTestId(/^discovery-language-track-/);
				expect(languageTracks).toHaveLength(2);
			});

			it("should filter tracks when French language chip is selected", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
				});

				// Click "French" chip -- French maps to "jazz" genre (2 jazz tracks)
				await user.click(screen.getByTestId("discovery-language-chip-french"));

				const languageSection = screen.getByTestId("discovery-popular-language");
				await waitFor(() => {
					expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in French");
				});

				// Should show only the 2 jazz tracks (French maps to jazz)
				const frenchTracks = within(languageSection).getAllByTestId(/^discovery-language-track-/);
				expect(frenchTracks).toHaveLength(2);
			});
		});

		describe("Language Deselection", () => {
			it("should deselect language chip and show all tracks when clicking same chip again", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
				});

				// Click Korean to select
				await user.click(screen.getByTestId("discovery-language-chip-korean"));

				const languageSection = screen.getByTestId("discovery-popular-language");
				await waitFor(() => {
					expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Korean");
				});

				// Click Korean again to deselect
				await user.click(screen.getByTestId("discovery-language-chip-korean"));

				// Heading should revert to "Popular in Language"
				await waitFor(() => {
					expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Language");
				});

				// All tracks should be shown again
				const languageTracks = within(languageSection).getAllByTestId(/^discovery-language-track-/);
				expect(languageTracks).toHaveLength(allMockTracks.length);
			});
		});
	});

	// ========== GENRE FILTERING ==========

	describe("Genre Filtering", () => {
		describe("Genre Chips Display", () => {
			it("should display genre filter chips with display names", async () => {
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-popular-genre")).toBeInTheDocument();
				});

				// Verify the genre chips container exists
				expect(screen.getByTestId("discovery-genre-chips")).toBeInTheDocument();

				// Verify each genre chip is present (using raw genre key, lowercased)
				const expectedGenres = ["rock", "r-and-b", "pop", "jazz", "electronic", "hip-hop", "classical"];
				for (const genre of expectedGenres) {
					expect(screen.getByTestId(`discovery-genre-chip-${genre}`)).toBeInTheDocument();
				}

				// Verify display names are rendered as text on the chips
				const genreChipsContainer = screen.getByTestId("discovery-genre-chips");
				expect(within(genreChipsContainer).getByText("Rock")).toBeInTheDocument();
				expect(within(genreChipsContainer).getByText("R&B")).toBeInTheDocument();
				expect(within(genreChipsContainer).getByText("Pop")).toBeInTheDocument();
				expect(within(genreChipsContainer).getByText("Jazz")).toBeInTheDocument();
				expect(within(genreChipsContainer).getByText("Electronic")).toBeInTheDocument();
				expect(within(genreChipsContainer).getByText("Hip-Hop")).toBeInTheDocument();
				expect(within(genreChipsContainer).getByText("Classical")).toBeInTheDocument();
			});
		});

		describe("Genre Selection", () => {
			it("should filter tracks when a genre chip is selected", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-genre-chips")).toBeInTheDocument();
				});

				// Click "Rock" chip -- should filter to only rock tracks (2)
				await user.click(screen.getByTestId("discovery-genre-chip-rock"));

				const genreSection = screen.getByTestId("discovery-popular-genre");
				await waitFor(() => {
					expect(within(genreSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Rock");
				});

				const genreTracks = within(genreSection).getAllByTestId(/^discovery-genre-track-/);
				expect(genreTracks).toHaveLength(2);
			});
		});

		describe("Genre Deselection", () => {
			it("should deselect genre chip when clicking same chip again", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-genre-chips")).toBeInTheDocument();
				});

				// Click Rock to select
				await user.click(screen.getByTestId("discovery-genre-chip-rock"));

				const genreSection = screen.getByTestId("discovery-popular-genre");
				await waitFor(() => {
					expect(within(genreSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Rock");
				});

				// Click Rock again to deselect
				await user.click(screen.getByTestId("discovery-genre-chip-rock"));

				// Heading should revert to "Popular in Genre"
				await waitFor(() => {
					expect(within(genreSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Genre");
				});

				// All tracks should be shown again
				const genreTracks = within(genreSection).getAllByTestId(/^discovery-genre-track-/);
				expect(genreTracks).toHaveLength(allMockTracks.length);
			});
		});
	});

	// ========== ERA FILTERING ==========

	describe("Era Filtering", () => {
		describe("Era Chips Display", () => {
			it("should display era filter chips", async () => {
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-jump-back-in")).toBeInTheDocument();
				});

				// Verify the era chips container exists
				expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();

				// Verify each era chip is present (lowercased in data-testid)
				const expectedEras = ["2020's", "2010's", "2000's", "90's", "80's"];
				for (const era of expectedEras) {
					expect(screen.getByTestId(`discovery-era-chip-${era.toLowerCase()}`)).toBeInTheDocument();
				}
			});
		});

		describe("Era Selection", () => {
			it("should filter tracks by era when an era chip is selected", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();
				});

				// Click "90's" chip -- jazz (1995) and r-and-b (1998) albums fall in 90's era = 4 tracks
				await user.click(screen.getByTestId("discovery-era-chip-90's"));

				const eraSection = screen.getByTestId("discovery-jump-back-in");
				await waitFor(() => {
					expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent(/Jump Back In.*90's/);
				});

				const eraTracks = within(eraSection).getAllByTestId(/^discovery-era-track-/);
				expect(eraTracks).toHaveLength(4);
			});

			it("should filter to 2010's era showing rock and pop tracks", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();
				});

				// Click "2010's" chip -- rock (2012) and pop (2015) albums fall in 2010's era = 4 tracks
				await user.click(screen.getByTestId("discovery-era-chip-2010's"));

				const eraSection = screen.getByTestId("discovery-jump-back-in");
				await waitFor(() => {
					expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent(/Jump Back In.*2010's/);
				});

				const era2010sTracks = within(eraSection).getAllByTestId(/^discovery-era-track-/);
				expect(era2010sTracks).toHaveLength(4);
			});
		});

		describe("Era Deselection", () => {
			it("should deselect era chip when clicking same chip again", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();
				});

				// Click 90's to select
				await user.click(screen.getByTestId("discovery-era-chip-90's"));

				const eraSection = screen.getByTestId("discovery-jump-back-in");
				await waitFor(() => {
					expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent(/Jump Back In.*90's/);
				});

				// Click 90's again to deselect
				await user.click(screen.getByTestId("discovery-era-chip-90's"));

				// Heading should revert to "Jump Back In"
				await waitFor(() => {
					expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent("Jump Back In");
				});

				// All tracks should be shown again
				const eraTracks = within(eraSection).getAllByTestId(/^discovery-era-track-/);
				expect(eraTracks).toHaveLength(allMockTracks.length);
			});
		});
	});

	// ========== TOP ARTISTS ==========

	describe("Top Artists", () => {
		describe("Artist Ranking", () => {
			it("should display top artists in ranked order", async () => {
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-top-artists")).toBeInTheDocument();
				});

				const topArtistsSection = screen.getByTestId("discovery-top-artists");

				// Verify artist rows exist
				const artistRows = within(topArtistsSection).getAllByTestId(/^discovery-artist-/);
				expect(artistRows.length).toBe(allMockArtists.length);

				// Artists should be ordered by followerCount descending
				// The first artist element should be artist-pop-1 (500K followers)
				expect(artistRows[0]).toHaveAttribute("data-testid", "discovery-artist-artist-pop-1");
				// The last should be artist-classical-1 (100K followers)
				expect(artistRows[artistRows.length - 1]).toHaveAttribute(
					"data-testid",
					"discovery-artist-artist-classical-1",
				);

				// Verify that names and follower counts are shown
				expect(within(topArtistsSection).getByText("Neon Dreams")).toBeInTheDocument();
				expect(within(topArtistsSection).getByText("500K followers")).toBeInTheDocument();
				expect(within(topArtistsSection).getByText("Vienna Philharmonic")).toBeInTheDocument();
				expect(within(topArtistsSection).getByText("100K followers")).toBeInTheDocument();
			});
		});

		describe("Artist Navigation", () => {
			it("should navigate to artist detail page when clicking a top artist", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPageWithLocation();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-top-artists")).toBeInTheDocument();
				});

				// Verify initial location
				expect(screen.getByTestId("location-display")).toHaveTextContent("/discover");

				// Click the first artist (Neon Dreams, artist-pop-1 — highest follower count)
				const firstArtist = screen.getByTestId("discovery-artist-artist-pop-1");
				await user.click(firstArtist);

				// Should navigate to /artist/artist-pop-1
				await waitFor(() => {
					expect(screen.getByTestId("location-display")).toHaveTextContent("/artist/artist-pop-1");
				});
			});
		});
	});

	// ========== VISUAL INDICATORS ==========

	describe("Visual Indicators", () => {
		describe("Selected Chip Highlight", () => {
			it("should highlight selected chip with ring classes", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderDiscoveryPage();

				await waitFor(() => {
					expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
				});

				const koreanChip = screen.getByTestId("discovery-language-chip-korean");

				// Before selection, chip should NOT have the active ring classes
				expect(koreanChip.className).not.toMatch(/ring-2/);
				expect(koreanChip.className).not.toMatch(/ring-melodio-green/);

				// Click to select
				await user.click(koreanChip);

				// After selection, chip should have the active ring classes
				await waitFor(() => {
					expect(koreanChip.className).toMatch(/ring-2/);
					expect(koreanChip.className).toMatch(/ring-melodio-green/);
				});

				// Click again to deselect
				await user.click(koreanChip);

				// After deselection, ring classes should be gone
				await waitFor(() => {
					expect(koreanChip.className).not.toMatch(/ring-2/);
					expect(koreanChip.className).not.toMatch(/ring-melodio-green/);
				});
			});
		});
	});
});
