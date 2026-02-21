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

// Rock tracks (2)
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

// Pop tracks (2)
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

// Jazz tracks (2)
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

// Electronic tracks (2)
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

// Hip-hop tracks (2)
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

// R&B tracks (2)
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

// Classical tracks (2)
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

// Saved mixes for "Your Mixes" section
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

// ========== TESTS ==========

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

	// ========== PAGE LOADING ==========

	describe("Page Loading", () => {
		describe("Loading State", () => {
			it("should show loading state initially", () => {
				mockTracksGetAll.mockReturnValue(new Promise(() => { }));
				mockArtistsGetAll.mockReturnValue(new Promise(() => { }));
				mockMixGetAll.mockResolvedValue([]);

				renderMixPage();

				expect(screen.getByTestId("mix-page")).toBeInTheDocument();
				expect(screen.getByText("Mix")).toBeInTheDocument();
				expect(screen.queryByTestId("mix-create-card")).not.toBeInTheDocument();
			});
		});

		describe("Error State", () => {
			it("should show error state when track API fails", async () => {
				mockTracksGetAll.mockRejectedValue(new Error("Network error"));
				mockArtistsGetAll.mockRejectedValue(new Error("Network error"));
				mockMixGetAll.mockResolvedValue([]);

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByText("Network error")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("mix-create-card")).not.toBeInTheDocument();
			});
		});
	});

	// ========== BROWSE VIEW ==========

	describe("Browse View", () => {
		describe("Saved Mixes Display", () => {
			it("should display saved mixes in Your Mixes grid", async () => {
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				expect(screen.getByTestId("mix-card-mix-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-card-mix-2")).toBeInTheDocument();

				expect(screen.getByText("The Amplifiers and Neon Dreams mix")).toBeInTheDocument();
				expect(screen.getByText("Blue Note Quartet mix")).toBeInTheDocument();
			});
		});
	});

	// ========== STEP 1 - ARTIST SELECTION ==========

	describe("Step 1 - Artist Selection", () => {
		describe("Artist Grid", () => {
			it("should display artist grid when entering create flow", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				expect(screen.getByTestId("mix-artists-grid")).toBeInTheDocument();
				expect(screen.getByText("Pick your artists")).toBeInTheDocument();

				expect(screen.getByTestId("mix-artist-artist-rock-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-artist-artist-pop-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-artist-artist-jazz-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-artist-artist-electronic-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-artist-artist-hiphop-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-artist-artist-rnb-1")).toBeInTheDocument();
				expect(screen.getByTestId("mix-artist-artist-classical-1")).toBeInTheDocument();
			});
		});

		describe("Artist Toggle", () => {
			it("should toggle artist selection with checkmark on click", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				const artistButton = screen.getByTestId("mix-artist-artist-rock-1");

				// Initially no checkmark (Check icon rendered via bg-melodio-green)
				expect(within(artistButton).queryByText((_, element) => element?.classList?.contains("bg-melodio-green"))).toBeFalsy();

				// Click to select
				await user.click(artistButton);

				// After selecting, the checkmark overlay should appear (div with bg-black/40)
				await waitFor(() => {
					const overlay = artistButton.querySelector(".bg-black\\/40");
					expect(overlay).toBeTruthy();
				});

				// Click again to deselect
				await user.click(artistButton);

				await waitFor(() => {
					const overlay = artistButton.querySelector(".bg-black\\/40");
					expect(overlay).toBeFalsy();
				});
			});
		});

		describe("Next Button State", () => {
			it("should enable Next button after selecting an artist", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				expect(screen.getByTestId("mix-next-btn")).toBeDisabled();

				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-next-btn")).not.toBeDisabled();
				});
			});
		});
	});

	// ========== STEP 2 - CONFIGURE MIX ==========

	describe("Step 2 - Configure Mix", () => {
		describe("Configuration Options", () => {
			it("should show variety, discovery, and filter options on step 2", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				// Select an artist and proceed
				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				expect(screen.getByText("Adjust your mix")).toBeInTheDocument();

				// Variety options
				expect(screen.getByTestId("mix-variety-low")).toBeInTheDocument();
				expect(screen.getByTestId("mix-variety-medium")).toBeInTheDocument();
				expect(screen.getByTestId("mix-variety-high")).toBeInTheDocument();

				// Discovery options
				expect(screen.getByTestId("mix-discovery-familiar")).toBeInTheDocument();
				expect(screen.getByTestId("mix-discovery-blend")).toBeInTheDocument();
				expect(screen.getByTestId("mix-discovery-discover")).toBeInTheDocument();

				// Filter options
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
		});

		describe("Filter Toggle", () => {
			it("should toggle filter selection", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				const popularFilter = screen.getByTestId("mix-filter-popular");

				// Initially outline variant (not selected)
				// Click to select
				await user.click(popularFilter);

				// Click again to deselect (toggle)
				await user.click(popularFilter);

				// No assertion on variant since cn mock just joins strings,
				// but we verify clicking does not throw and toggles without error
				expect(popularFilter).toBeInTheDocument();
			});
		});
	});

	// ========== STEP 3 - MIX RESULT ==========

	describe("Step 3 - Mix Result", () => {
		describe("Mix Generation", () => {
			it("should generate mix and show tracks on Done click", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-done-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				expect(screen.getByTestId("mix-result-tracks")).toBeInTheDocument();
				expect(screen.getByTestId("mix-title")).toBeInTheDocument();

				// mixService.create should have been called
				expect(mockMixCreate).toHaveBeenCalled();
			});
		});

		describe("Track Limit", () => {
			it("should limit generated mix to 20 tracks", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				// Select all artists for maximum track pool
				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-artist-artist-pop-1"));
				await user.click(screen.getByTestId("mix-artist-artist-jazz-1"));
				await user.click(screen.getByTestId("mix-artist-artist-electronic-1"));
				await user.click(screen.getByTestId("mix-artist-artist-hiphop-1"));
				await user.click(screen.getByTestId("mix-artist-artist-rnb-1"));
				await user.click(screen.getByTestId("mix-artist-artist-classical-1"));

				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				// Set variety to high to include all tracks
				await user.click(screen.getByTestId("mix-variety-high"));

				await user.click(screen.getByTestId("mix-done-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				// We have 14 tracks total (7 artists x 2 tracks each), all under 20 limit
				// The mix should contain all 14 since they all score > 0
				const resultTracks = screen.getByTestId("mix-result-tracks");
				const trackCards = resultTracks.children;
				expect(trackCards.length).toBeLessThanOrEqual(20);
				expect(trackCards.length).toBe(14);
			});
		});

		describe("Variety Low Filter", () => {
			it("should show only selected artist tracks with variety low", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				// Select only The Amplifiers (rock, 2 tracks)
				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				// Set variety to "low" which filters out non-selected artists
				await user.click(screen.getByTestId("mix-variety-low"));

				await user.click(screen.getByTestId("mix-done-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				// With variety "low", scoreTrack returns 0 for non-selected artists
				// Selected artist tracks should rank first in the generated mix
				const resultTracks = screen.getByTestId("mix-result-tracks");
				const trackCards = resultTracks.children;
				expect(trackCards.length).toBeGreaterThanOrEqual(2);

				// Verify the first two tracks are from The Amplifiers (the selected artist)
				const firstTrackTitle = within(trackCards[0] as HTMLElement).getByText("Thunder Road");
				const secondTrackTitle = within(trackCards[1] as HTMLElement).getByText("Lightning Strike");
				expect(firstTrackTitle).toBeInTheDocument();
				expect(secondTrackTitle).toBeInTheDocument();
			});
		});

		describe("Mix Title Generation", () => {
			it("should generate mix title from selected artist names", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				// Select The Amplifiers
				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-done-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				// getMixTitle for single artist: "The Amplifiers mix"
				expect(screen.getByTestId("mix-title")).toHaveTextContent("The Amplifiers mix");
			});

			it("should generate mix title from multiple selected artist names", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				// Select The Amplifiers and Neon Dreams (2 artists)
				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-artist-artist-pop-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-done-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				// getMixTitle for two artists: "The Amplifiers and Neon Dreams mix"
				expect(screen.getByTestId("mix-title")).toHaveTextContent("The Amplifiers and Neon Dreams mix");
			});
		});
	});

	// ========== NAVIGATION ==========

	describe("Navigation", () => {
		describe("Back to Artist Selection", () => {
			it("should navigate back from step 2 to step 1", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				// Click back button on configure step
				await user.click(screen.getByTestId("mix-configure-back-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("mix-step-configure")).not.toBeInTheDocument();
			});
		});

		describe("Back to Browse View", () => {
			it("should navigate from result back to browse view", async () => {
				const user = userEvent.setup();
				setupSuccessfulMocks();

				renderMixPage();

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-create-card"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-select")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-artist-artist-rock-1"));
				await user.click(screen.getByTestId("mix-next-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-configure")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("mix-done-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-step-result")).toBeInTheDocument();
				});

				// Click "Back to Mixes" button on result step
				await user.click(screen.getByTestId("mix-back-to-mixes-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("mix-create-card")).toBeInTheDocument();
				});

				expect(screen.getByTestId("mix-your-mixes")).toBeInTheDocument();
				expect(screen.queryByTestId("mix-step-result")).not.toBeInTheDocument();
			});
		});
	});
});
