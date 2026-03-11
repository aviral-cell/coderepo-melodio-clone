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

	describe("Page Loading", () => {
		it("should show error state when API fails", async () => {
			// Mock all API calls to reject
			mockTracksGetAll.mockRejectedValue(new Error("Network error"));
			mockAlbumsGetAll.mockRejectedValue(new Error("Network error"));
			mockArtistsGetAll.mockRejectedValue(new Error("Network error"));

			// Render discovery page
			renderDiscoveryPage();

			// Verify error state displayed
			await waitFor(() => {
				expect(screen.getByTestId("discovery-error")).toBeInTheDocument();
			});

			// Verify loading and content not shown
			expect(screen.queryByTestId("discovery-loading")).not.toBeInTheDocument();
			expect(screen.queryByTestId("discovery-new-this-week")).not.toBeInTheDocument();
		});
	});

	describe("New This Week", () => {
		it("should display new tracks this week", async () => {
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for new this week section
			await waitFor(() => {
				expect(screen.getByTestId("discovery-new-this-week")).toBeInTheDocument();
			});

			// Verify all tracks displayed
			const newThisWeekSection = screen.getByTestId("discovery-new-this-week");
			const trackElements = within(newThisWeekSection).getAllByTestId(/^discovery-new-track-/);
			expect(trackElements.length).toBe(allMockTracks.length);
		});
	});

	describe("Language Filtering", () => {
		it("should display language filter chips", async () => {
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for language section
			await waitFor(() => {
				expect(screen.getByTestId("discovery-popular-language")).toBeInTheDocument();
			});

			// Verify language chips container present
			expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();

			// Verify all language chips rendered
			const expectedLanguages = ["english", "korean", "french", "german", "spanish", "chinese"];
			for (const lang of expectedLanguages) {
				expect(screen.getByTestId(`discovery-language-chip-${lang}`)).toBeInTheDocument();
			}
		});

		it("should filter tracks by language", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for language chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
			});

			// Click Korean language chip
			await user.click(screen.getByTestId("discovery-language-chip-korean"));

			// Verify heading updated to Korean
			const languageSection = screen.getByTestId("discovery-popular-language");
			await waitFor(() => {
				expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Korean");
			});

			// Verify filtered to 2 tracks
			const languageTracks = within(languageSection).getAllByTestId(/^discovery-language-track-/);
			expect(languageTracks).toHaveLength(2);
		});

		it("should deselect language and show all tracks", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for language chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
			});

			// Select Korean language
			await user.click(screen.getByTestId("discovery-language-chip-korean"));

			// Verify filtered to Korean
			const languageSection = screen.getByTestId("discovery-popular-language");
			await waitFor(() => {
				expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Korean");
			});

			// Deselect Korean language
			await user.click(screen.getByTestId("discovery-language-chip-korean"));

			// Verify heading reset to default
			await waitFor(() => {
				expect(within(languageSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Language");
			});

			// Verify all tracks restored
			const languageTracks = within(languageSection).getAllByTestId(/^discovery-language-track-/);
			expect(languageTracks).toHaveLength(allMockTracks.length);
		});
	});

	describe("Genre Filtering", () => {
		it("should display genre filter chips", async () => {
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for genre section
			await waitFor(() => {
				expect(screen.getByTestId("discovery-popular-genre")).toBeInTheDocument();
			});

			// Verify genre chips container present
			expect(screen.getByTestId("discovery-genre-chips")).toBeInTheDocument();

			// Verify all genre chip test IDs
			const expectedGenres = ["rock", "r-and-b", "pop", "jazz", "electronic", "hip-hop", "classical"];
			for (const genre of expectedGenres) {
				expect(screen.getByTestId(`discovery-genre-chip-${genre}`)).toBeInTheDocument();
			}

			// Verify genre chip display labels
			const genreChipsContainer = screen.getByTestId("discovery-genre-chips");
			expect(within(genreChipsContainer).getByText("Rock")).toBeInTheDocument();
			expect(within(genreChipsContainer).getByText("R&B")).toBeInTheDocument();
			expect(within(genreChipsContainer).getByText("Pop")).toBeInTheDocument();
			expect(within(genreChipsContainer).getByText("Jazz")).toBeInTheDocument();
			expect(within(genreChipsContainer).getByText("Electronic")).toBeInTheDocument();
			expect(within(genreChipsContainer).getByText("Hip-Hop")).toBeInTheDocument();
			expect(within(genreChipsContainer).getByText("Classical")).toBeInTheDocument();
		});

		it("should filter tracks by genre", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for genre chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-genre-chips")).toBeInTheDocument();
			});

			// Click Rock genre chip
			await user.click(screen.getByTestId("discovery-genre-chip-rock"));

			// Verify heading updated to Rock
			const genreSection = screen.getByTestId("discovery-popular-genre");
			await waitFor(() => {
				expect(within(genreSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Rock");
			});

			// Verify filtered to 2 rock tracks
			const genreTracks = within(genreSection).getAllByTestId(/^discovery-genre-track-/);
			expect(genreTracks).toHaveLength(2);
		});

		it("should deselect genre and show all tracks", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for genre chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-genre-chips")).toBeInTheDocument();
			});

			// Select Rock genre
			await user.click(screen.getByTestId("discovery-genre-chip-rock"));

			// Verify filtered to Rock
			const genreSection = screen.getByTestId("discovery-popular-genre");
			await waitFor(() => {
				expect(within(genreSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Rock");
			});

			// Deselect Rock genre
			await user.click(screen.getByTestId("discovery-genre-chip-rock"));

			// Verify heading reset to default
			await waitFor(() => {
				expect(within(genreSection).getByRole("heading", { level: 2 })).toHaveTextContent("Popular in Genre");
			});

			// Verify all tracks restored
			const genreTracks = within(genreSection).getAllByTestId(/^discovery-genre-track-/);
			expect(genreTracks).toHaveLength(allMockTracks.length);
		});
	});

	describe("Era Filtering", () => {
		it("should display era filter chips", async () => {
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for jump back in section
			await waitFor(() => {
				expect(screen.getByTestId("discovery-jump-back-in")).toBeInTheDocument();
			});

			// Verify era chips container present
			expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();

			// Verify all era chips rendered
			const expectedEras = ["2020's", "2010's", "2000's", "90's", "80's"];
			for (const era of expectedEras) {
				expect(screen.getByTestId(`discovery-era-chip-${era.toLowerCase()}`)).toBeInTheDocument();
			}
		});

		it("should filter tracks by era", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for era chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();
			});

			// Click 90's era chip
			await user.click(screen.getByTestId("discovery-era-chip-90's"));

			// Verify heading updated to 90's
			const eraSection = screen.getByTestId("discovery-jump-back-in");
			await waitFor(() => {
				expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent(/Jump Back In.*90's/);
			});

			// Verify filtered to 4 tracks from 90's
			const eraTracks = within(eraSection).getAllByTestId(/^discovery-era-track-/);
			expect(eraTracks).toHaveLength(4);
		});

		it("should deselect era and show all tracks", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for era chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-era-chips")).toBeInTheDocument();
			});

			// Select 90's era
			await user.click(screen.getByTestId("discovery-era-chip-90's"));

			// Verify filtered to 90's
			const eraSection = screen.getByTestId("discovery-jump-back-in");
			await waitFor(() => {
				expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent(/Jump Back In.*90's/);
			});

			// Deselect 90's era
			await user.click(screen.getByTestId("discovery-era-chip-90's"));

			// Verify heading reset to default
			await waitFor(() => {
				expect(within(eraSection).getByRole("heading", { level: 2 })).toHaveTextContent("Jump Back In");
			});

			// Verify all tracks restored
			const eraTracks = within(eraSection).getAllByTestId(/^discovery-era-track-/);
			expect(eraTracks).toHaveLength(allMockTracks.length);
		});
	});

	describe("Top Artists", () => {
		it("should display top artists ranked by followers", async () => {
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for top artists section
			await waitFor(() => {
				expect(screen.getByTestId("discovery-top-artists")).toBeInTheDocument();
			});

			// Get all artist rows
			const topArtistsSection = screen.getByTestId("discovery-top-artists");
			const artistRows = within(topArtistsSection).getAllByTestId(/^discovery-artist-/);
			expect(artistRows.length).toBe(allMockArtists.length);

			// Verify sorted by followers descending
			expect(artistRows[0]).toHaveAttribute("data-testid", "discovery-artist-artist-pop-1");
			expect(artistRows[artistRows.length - 1]).toHaveAttribute(
				"data-testid",
				"discovery-artist-artist-classical-1",
			);

			// Verify artist details displayed
			expect(within(topArtistsSection).getByText("Neon Dreams")).toBeInTheDocument();
			expect(within(topArtistsSection).getByText("500K followers")).toBeInTheDocument();
			expect(within(topArtistsSection).getByText("Vienna Philharmonic")).toBeInTheDocument();
			expect(within(topArtistsSection).getByText("100K followers")).toBeInTheDocument();
		});

		it("should navigate to artist page on click", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page with location tracking
			renderDiscoveryPageWithLocation();

			// Wait for top artists section
			await waitFor(() => {
				expect(screen.getByTestId("discovery-top-artists")).toBeInTheDocument();
			});

			// Verify initial location
			expect(screen.getByTestId("location-display")).toHaveTextContent("/discover");

			// Click on first artist
			const firstArtist = screen.getByTestId("discovery-artist-artist-pop-1");
			await user.click(firstArtist);

			// Verify navigated to artist page
			await waitFor(() => {
				expect(screen.getByTestId("location-display")).toHaveTextContent("/artist/artist-pop-1");
			});
		});
	});

	describe("Visual Indicators", () => {
		it("should highlight selected chip", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render discovery page
			renderDiscoveryPage();

			// Wait for language chips
			await waitFor(() => {
				expect(screen.getByTestId("discovery-language-chips")).toBeInTheDocument();
			});

			// Verify chip not highlighted initially
			const koreanChip = screen.getByTestId("discovery-language-chip-korean");
			expect(koreanChip.className).not.toMatch(/ring-2/);
			expect(koreanChip.className).not.toMatch(/ring-melodio-green/);

			// Click Korean chip
			await user.click(koreanChip);

			// Verify chip highlighted with ring
			await waitFor(() => {
				expect(koreanChip.className).toMatch(/ring-2/);
				expect(koreanChip.className).toMatch(/ring-melodio-green/);
			});

			// Deselect Korean chip
			await user.click(koreanChip);

			// Verify highlight removed
			await waitFor(() => {
				expect(koreanChip.className).not.toMatch(/ring-2/);
				expect(koreanChip.className).not.toMatch(/ring-melodio-green/);
			});
		});
	});
});
