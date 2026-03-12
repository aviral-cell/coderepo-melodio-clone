// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import MixPage from "@/pages/MixPage";
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

jest.mock("@/shared/services/mix.service", () => ({
	mixService: {
		create: jest.fn(),
		getAll: jest.fn(),
		getById: jest.fn(),
		delete: jest.fn(),
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

const allMockArtists = [
	createMockArtist({
		_id: "artist-rock-1",
		name: "The Amplifiers",
		genres: ["rock"],
		followerCount: 250000,
	}),
	createMockArtist({
		_id: "artist-pop-1",
		name: "Neon Dreams",
		genres: ["pop"],
		followerCount: 500000,
	}),
	createMockArtist({
		_id: "artist-jazz-1",
		name: "Blue Note Quartet",
		genres: ["jazz"],
		followerCount: 150000,
	}),
	createMockArtist({
		_id: "artist-electronic-1",
		name: "Synthwave Collective",
		genres: ["electronic"],
		followerCount: 300000,
	}),
	createMockArtist({
		_id: "artist-hiphop-1",
		name: "Urban Beats",
		genres: ["hip-hop"],
		followerCount: 400000,
	}),
	createMockArtist({
		_id: "artist-rnb-1",
		name: "Velvet Voice",
		genres: ["r-and-b"],
		followerCount: 200000,
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

const mockArtistsResponse = {
	items: allMockArtists,
	total: allMockArtists.length,
	page: 1,
	limit: 100,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

const mockSavedMixes = [
	{
		_id: "mix-1",
		title: "The Amplifiers and Neon Dreams mix",
		artistIds: ["artist-rock-1", "artist-pop-1"],
		config: { variety: "medium", discovery: "blend", filters: [] },
		trackIds: ["track-rock-1", "track-pop-1"],
		coverImages: ["/artist-rock.jpg", "/artist-pop.jpg"],
		trackCount: 2,
		createdAt: "2024-06-15T00:00:00.000Z",
	},
	{
		_id: "mix-2",
		title: "Blue Note Quartet mix",
		artistIds: ["artist-jazz-1"],
		config: { variety: "low", discovery: "familiar", filters: ["Chill"] },
		trackIds: ["track-jazz-1", "track-jazz-2"],
		coverImages: ["/artist-jazz.jpg"],
		trackCount: 2,
		createdAt: "2024-07-20T00:00:00.000Z",
	},
];

// ========== TEST WRAPPER ==========

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={["/mix"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>{children}</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderMixPage() {
	return render(
		<TestWrapper>
			<MixPage />
		</TestWrapper>,
	);
}

// ========== SETUP / TEARDOWN ==========

const originalLocation = window.location;

import { tracksService, artistsService } from "@/shared/services";
import { mixService } from "@/shared/services/mix.service";

const mockTracksGetAll = tracksService.getAll as jest.Mock;
const mockArtistsGetAll = artistsService.getAll as jest.Mock;
const mockMixGetAll = mixService.getAll as jest.Mock;
const mockMixCreate = mixService.create as jest.Mock;

function setupSuccessfulMocks() {
	mockTracksGetAll.mockResolvedValue(mockTracksResponse);
	mockArtistsGetAll.mockResolvedValue(mockArtistsResponse);
	mockMixGetAll.mockResolvedValue(mockSavedMixes);
	mockMixCreate.mockResolvedValue(mockSavedMixes[0]);
}

describe("Create Mix", () => {
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
			reload: jest.fn(),
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Page Loading", () => {
		it("should show loading state initially", () => {
			// Mock APIs to never resolve (pending state)
			mockTracksGetAll.mockReturnValue(new Promise(() => { }));
			mockArtistsGetAll.mockReturnValue(new Promise(() => { }));
			mockMixGetAll.mockResolvedValue([]);

			// Render mix page
			renderMixPage();

			// Verify page and heading present
			expect(screen.getByTestId("mix-page")).toBeInTheDocument();
			expect(screen.getByText("Mix")).toBeInTheDocument();

			// Verify create card not shown during loading
			expect(screen.queryByTestId("mix-create-card")).not.toBeInTheDocument();
		});

		it("should show error when API fails", async () => {
			// Mock APIs to reject
			mockTracksGetAll.mockRejectedValue(new Error("Network error"));
			mockArtistsGetAll.mockRejectedValue(new Error("Network error"));
			mockMixGetAll.mockResolvedValue([]);

			// Render mix page
			renderMixPage();

			// Verify error message displayed
			await waitFor(() => {
				expect(screen.getByText("Network error")).toBeInTheDocument();
			});

			// Verify create card not shown
			expect(screen.queryByTestId("mix-create-card")).not.toBeInTheDocument();
		});
	});

	describe("Browse View", () => {
		it("should display saved mixes", async () => {
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Verify saved mix cards displayed
			expect(screen.getByTestId("mix-card-mix-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-card-mix-2")).toBeInTheDocument();

			// Verify mix titles
			expect(screen.getByText("The Amplifiers and Neon Dreams mix")).toBeInTheDocument();
			expect(screen.getByText("Blue Note Quartet mix")).toBeInTheDocument();
		});
	});

	describe("Step 1 - Artist Selection", () => {
		it("should display artist grid in create flow", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Click create card to start flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Verify artist grid and heading
			expect(screen.getByTestId("mix-artists-grid")).toBeInTheDocument();
			expect(screen.getByText("Pick your artists")).toBeInTheDocument();

			// Verify all artists displayed
			expect(screen.getByTestId("mix-artist-artist-rock-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-artist-artist-pop-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-artist-artist-jazz-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-artist-artist-electronic-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-artist-artist-hiphop-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-artist-artist-rnb-1")).toBeInTheDocument();
			expect(screen.getByTestId("mix-artist-artist-classical-1")).toBeInTheDocument();
		});

		it("should toggle artist selection on click", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Click create card to start flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Verify artist not selected initially
			const artistButton = screen.getByTestId("mix-artist-artist-rock-1");
			expect(within(artistButton).queryByText((_, element) => element?.classList?.contains("bg-melodio-green"))).toBeFalsy();

			// Select artist
			await user.click(artistButton);

			// Verify selection overlay appears
			await waitFor(() => {
				const overlay = artistButton.querySelector(".bg-black\\/40");
				expect(overlay).toBeTruthy();
			});

			// Deselect artist
			await user.click(artistButton);

			// Verify selection overlay removed
			await waitFor(() => {
				const overlay = artistButton.querySelector(".bg-black\\/40");
				expect(overlay).toBeFalsy();
			});
		});

		it("should enable Next button after selecting an artist", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Click create card to start flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Verify Next button disabled initially
			expect(screen.getByTestId("mix-next-btn")).toBeDisabled();

			// Select an artist
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));

			// Verify Next button enabled
			await waitFor(() => {
				expect(screen.getByTestId("mix-next-btn")).not.toBeDisabled();
			});
		});
	});

	describe("Step 2 - Configure Mix", () => {
		it("should show configuration options on step 2", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select artist and proceed to step 2
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Verify heading
			expect(screen.getByText("Adjust your mix")).toBeInTheDocument();

			// Verify variety options
			expect(screen.getByTestId("mix-variety-low")).toBeInTheDocument();
			expect(screen.getByTestId("mix-variety-medium")).toBeInTheDocument();
			expect(screen.getByTestId("mix-variety-high")).toBeInTheDocument();

			// Verify discovery options
			expect(screen.getByTestId("mix-discovery-familiar")).toBeInTheDocument();
			expect(screen.getByTestId("mix-discovery-blend")).toBeInTheDocument();
			expect(screen.getByTestId("mix-discovery-discover")).toBeInTheDocument();

			// Verify filter options
			expect(screen.getByTestId("mix-filters")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-popular")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-deep-cuts")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-new-releases")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-pump-up")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-chill")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-upbeat")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-downbeat")).toBeInTheDocument();
			expect(screen.getByTestId("mix-filter-focus")).toBeInTheDocument();
		});

		it("should toggle filter selection", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select artist and proceed to step 2
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Select popular filter
			const popularFilter = screen.getByTestId("mix-filter-popular");
			await user.click(popularFilter);

			// Deselect popular filter
			await user.click(popularFilter);

			// Verify filter still in DOM
			expect(popularFilter).toBeInTheDocument();
		});
	});

	describe("Step 3 - Mix Result", () => {
		it("should generate mix on Done click", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select artist and proceed to configure
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Click Done to generate mix
			await user.click(screen.getByTestId("mix-done-btn"));

			// Wait for result step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
			});

			// Verify result tracks and title displayed
			expect(screen.getByTestId("mix-result-tracks")).toBeInTheDocument();
			expect(screen.getByTestId("mix-title")).toBeInTheDocument();

			// Verify mix create API called
			expect(mockMixCreate).toHaveBeenCalled();
		});

		it("should limit generated mix to 20 tracks", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select all artists
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-artist-artist-pop-1"));
			await user.click(screen.getByTestId("mix-artist-artist-jazz-1"));
			await user.click(screen.getByTestId("mix-artist-artist-electronic-1"));
			await user.click(screen.getByTestId("mix-artist-artist-hiphop-1"));
			await user.click(screen.getByTestId("mix-artist-artist-rnb-1"));
			await user.click(screen.getByTestId("mix-artist-artist-classical-1"));

			// Proceed to configure step
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Set high variety
			await user.click(screen.getByTestId("mix-variety-high"));

			// Click Done to generate mix
			await user.click(screen.getByTestId("mix-done-btn"));

			// Wait for result step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
			});

			// Verify track count limited to 20 max
			const resultTracks = screen.getByTestId("mix-result-tracks");
			const trackCards = resultTracks.children;
			expect(trackCards.length).toBeLessThanOrEqual(20);
			expect(trackCards.length).toBe(14);
		});

		it("should filter to selected artist with low variety", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select rock artist and proceed
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Set low variety
			await user.click(screen.getByTestId("mix-variety-low"));

			// Click Done to generate mix
			await user.click(screen.getByTestId("mix-done-btn"));

			// Wait for result step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
			});

			// Verify tracks from selected artist only
			const resultTracks = screen.getByTestId("mix-result-tracks");
			const trackCards = resultTracks.children;
			expect(trackCards.length).toBeGreaterThanOrEqual(2);

			// Verify specific track titles
			const firstTrackTitle = within(trackCards[0] as HTMLElement).getByText("Thunder Road");
			const secondTrackTitle = within(trackCards[1] as HTMLElement).getByText("Lightning Strike");
			expect(firstTrackTitle).toBeInTheDocument();
			expect(secondTrackTitle).toBeInTheDocument();
		});

		describe("Mix Title Generation", () => {
			it("should generate title for multi-artist mix", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				// Render mix page
				renderMixPage();

				// Wait for page to load
				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				// Start create flow
				await user.click(screen.getByTestId("mix-create-card"));

				// Wait for artist selection step
				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				// Select two artists and proceed
				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-artist-artist-pop-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				// Wait for configure step
				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				// Click Done to generate mix
				await user.click(screen.getByTestId("mix-done-btn"));

				// Wait for result step
				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				// Verify multi-artist title format
				expect(screen.getByTestId("mix-title")).toHaveTextContent("The Amplifiers and Neon Dreams mix");
			});
		});
	});

	describe("Navigation", () => {
		it("should navigate back to artist selection", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select artist and proceed to configure
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Click back button
			await user.click(screen.getByTestId("mix-configure-back-btn"));

			// Verify returned to artist selection
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Verify configure step gone
			expect(screen.queryByTestId("mix-step-configure")).not.toBeInTheDocument();
		});

		it("should navigate back to browse view", async () => {
			const user = userEvent.setup();
			setupSuccessfulMocks();

			// Render mix page
			renderMixPage();

			// Wait for page to load
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Start create flow
			await user.click(screen.getByTestId("mix-create-card"));

			// Wait for artist selection step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
			});

			// Select artist and proceed through all steps
			await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
			await user.click(screen.getByTestId("mix-next-btn"));

			// Wait for configure step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
			});

			// Click Done to generate mix
			await user.click(screen.getByTestId("mix-done-btn"));

			// Wait for result step
			await waitFor(() => {
				expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
			});

			// Click back to mixes
			await user.click(screen.getByTestId("mix-back-to-mixes-btn"));

			// Verify returned to browse view
			await waitFor(() => {
				expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
			});

			// Verify your mixes section visible and result gone
			expect(screen.getByTestId("mix-your-mixes")).toBeInTheDocument();
			expect(screen.queryByTestId("mix-step-result")).not.toBeInTheDocument();
		});
	});
});
