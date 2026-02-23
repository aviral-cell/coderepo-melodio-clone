// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import LikedTracksPage from "@/pages/LikedTracksPage";
import { LikedTracksProvider } from "@/shared/contexts/LikedTracksContext";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// ========== MOCKS ==========

jest.mock("@/shared/services/track-like.service", () => ({
	trackLikeService: {
		getLikedIds: jest.fn(),
		likeTrack: jest.fn(),
		dislikeTrack: jest.fn(),
		removeReaction: jest.fn(),
		getLikedTracks: jest.fn(),
		getLikeStatus: jest.fn(),
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

jest.mock("@/shared/utils/likedTracksUtils", () => ({
	sortLikedTracks: jest.fn((tracks: any[], sortBy: string) => tracks),
	LikedSortOption: undefined,
}));

// ========== MOCK DATA ==========

const mockTracks = [
	{
		_id: "track-1",
		title: "Loved Song",
		durationInSeconds: 210,
		trackNumber: 1,
		genre: "rock",
		playCount: 5000,
		coverImageUrl: "/cover1.jpg",
		createdAt: "2024-01-20T00:00:00.000Z",
		updatedAt: "2024-01-20T00:00:00.000Z",
		artistId: { _id: "artist-1", name: "Rock Star", imageUrl: "/artist1.jpg" },
		albumId: { _id: "album-1", title: "Rock Album", coverImageUrl: "/album1.jpg" },
		likedAt: "2024-01-25T00:00:00.000Z",
	},
	{
		_id: "track-2",
		title: "Another Fave",
		durationInSeconds: 180,
		trackNumber: 2,
		genre: "pop",
		playCount: 3000,
		coverImageUrl: "/cover2.jpg",
		createdAt: "2024-01-19T00:00:00.000Z",
		updatedAt: "2024-01-19T00:00:00.000Z",
		artistId: { _id: "artist-2", name: "Pop Star", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-2", title: "Pop Album", coverImageUrl: "/album2.jpg" },
		likedAt: "2024-01-24T00:00:00.000Z",
	},
];

// ========== TEST WRAPPER ==========

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={["/liked"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>
						<LikedTracksProvider>
							<Routes>
								<Route path="/liked" element={children} />
							</Routes>
						</LikedTracksProvider>
					</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderLikedTracksPage() {
	return render(
		<TestWrapper>
			<LikedTracksPage />
		</TestWrapper>,
	);
}

// ========== SETUP / TEARDOWN ==========

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

import { trackLikeService } from "@/shared/services/track-like.service";
import { sortLikedTracks } from "@/shared/utils/likedTracksUtils";

const mockGetLikedIds = trackLikeService.getLikedIds as jest.Mock;
const mockGetLikedTracks = trackLikeService.getLikedTracks as jest.Mock;
const mockRemoveReaction = trackLikeService.removeReaction as jest.Mock;
const mockLikeTrack = trackLikeService.likeTrack as jest.Mock;
const mockSortLikedTracks = sortLikedTracks as jest.Mock;

describe("Liked Tracks Page", () => {
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

		mockGetLikedIds.mockResolvedValue({ likedIds: ["track-1", "track-2"], dislikedIds: [] });
		mockGetLikedTracks.mockResolvedValue({
			items: mockTracks,
			total: 2,
			page: 1,
			limit: 20,
			totalPages: 1,
		});
		mockRemoveReaction.mockResolvedValue({ status: null, trackId: "track-1" });
		mockLikeTrack.mockResolvedValue({ status: "like", trackId: "track-1" });
		mockSortLikedTracks.mockImplementation((tracks: any[]) => tracks);
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	// ========== LOADING STATE ==========

	it("should show loading skeleton initially", () => {
		// Delay the resolution so the loading state is visible
		mockGetLikedIds.mockReturnValue(new Promise(() => {}));

		renderLikedTracksPage();

		const page = screen.getByTestId("liked-tracks-page");
		expect(page).toBeInTheDocument();
	});

	// ========== TRACK DISPLAY ==========

	it("should render liked tracks list after loading", async () => {
		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-list")).toBeInTheDocument();
		});

		// Both tracks should be rendered
		expect(screen.getByTestId("liked-track-track-1")).toBeInTheDocument();
		expect(screen.getByTestId("liked-track-track-2")).toBeInTheDocument();
	});

	it("should display track title, artist name, and album title", async () => {
		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-list")).toBeInTheDocument();
		});

		// Track titles
		expect(screen.getByText("Loved Song")).toBeInTheDocument();
		expect(screen.getByText("Another Fave")).toBeInTheDocument();

		// Artist names
		expect(screen.getAllByText("Rock Star").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Pop Star").length).toBeGreaterThanOrEqual(1);

		// Album titles (appear in multiple locations: inline and column)
		expect(screen.getAllByText("Rock Album").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Pop Album").length).toBeGreaterThanOrEqual(1);
	});

	// ========== EMPTY STATE ==========

	it("should show empty state when no liked tracks", async () => {
		mockGetLikedIds.mockResolvedValue({ likedIds: [], dislikedIds: [] });
		mockGetLikedTracks.mockResolvedValue({
			items: [],
			total: 0,
			page: 1,
			limit: 20,
			totalPages: 0,
		});

		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByText("No liked tracks yet")).toBeInTheDocument();
		});

		// The tracks list should not be present
		expect(screen.queryByTestId("liked-tracks-list")).not.toBeInTheDocument();
	});

	// ========== SORT DROPDOWN ==========

	it("should show sort dropdown with options", async () => {
		const user = userEvent.setup();

		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-sort-btn")).toBeInTheDocument();
		});

		// Click the sort button to open dropdown
		await user.click(screen.getByTestId("liked-tracks-sort-btn"));

		// All sort options should be visible
		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-sort-recent")).toBeInTheDocument();
			expect(screen.getByTestId("liked-tracks-sort-title")).toBeInTheDocument();
			expect(screen.getByTestId("liked-tracks-sort-artist")).toBeInTheDocument();
			expect(screen.getByTestId("liked-tracks-sort-duration")).toBeInTheDocument();
		});
	});

	it("should call handleSortChange when sort option is clicked", async () => {
		const user = userEvent.setup();

		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-sort-btn")).toBeInTheDocument();
		});

		// Open the sort dropdown
		await user.click(screen.getByTestId("liked-tracks-sort-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-sort-title")).toBeInTheDocument();
		});

		// Click "Title A-Z" option
		await user.click(screen.getByTestId("liked-tracks-sort-title"));

		// The sortLikedTracks mock should have been called with the "title" sort option
		await waitFor(() => {
			expect(mockSortLikedTracks).toHaveBeenCalledWith(expect.any(Array), "title");
		});
	});

	// ========== TRACK NUMBERS ==========

	it("should render track numbers (1, 2, etc.)", async () => {
		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-list")).toBeInTheDocument();
		});

		// Track rows contain index numbers 1 and 2
		const trackRow1 = screen.getByTestId("liked-track-track-1");
		const trackRow2 = screen.getByTestId("liked-track-track-2");

		expect(within(trackRow1).getByText("1")).toBeInTheDocument();
		expect(within(trackRow2).getByText("2")).toBeInTheDocument();
	});

	// ========== NAVIGATION LINKS ==========

	it("should have links to track detail, artist detail, and album detail pages", async () => {
		renderLikedTracksPage();

		await waitFor(() => {
			expect(screen.getByTestId("liked-tracks-list")).toBeInTheDocument();
		});

		// Track detail links
		const trackLinks = screen.getAllByRole("link");

		// Check for track detail links (/track/{id})
		const trackDetailLinks = trackLinks.filter((link) => link.getAttribute("href")?.startsWith("/track/"));
		expect(trackDetailLinks.length).toBeGreaterThanOrEqual(2);

		// Check for artist detail links (/artist/{id})
		const artistDetailLinks = trackLinks.filter((link) => link.getAttribute("href")?.startsWith("/artist/"));
		expect(artistDetailLinks.length).toBeGreaterThanOrEqual(2);

		// Check for album detail links (/album/{id})
		const albumDetailLinks = trackLinks.filter((link) => link.getAttribute("href")?.startsWith("/album/"));
		expect(albumDetailLinks.length).toBeGreaterThanOrEqual(2);
	});
});
