// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import ArtistDetailPage from "@/pages/ArtistDetailPage";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// ========== MOCKS ==========

jest.mock("@/shared/services", () => ({
	artistsService: {
		getById: jest.fn(),
	},
	tracksService: {
		getAll: jest.fn(),
	},
}));

jest.mock("@/shared/services/artist-interaction.service", () => ({
	artistInteractionService: {
		getInteraction: jest.fn(),
		toggleFollow: jest.fn(),
		rateArtist: jest.fn(),
	},
}));

jest.mock("@/shared/services/track-like.service", () => ({
	trackLikeService: {
		getLikedIds: jest.fn().mockResolvedValue({ likedIds: [], dislikedIds: [] }),
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

jest.mock("@/shared/contexts/LikedTracksContext", () => ({
	LikedTracksProvider: ({ children }: { children: React.ReactNode }) => children,
	useLikedTracksContext: () => ({
		likedIds: new Set(),
		dislikedIds: new Set(),
		likedCount: 0,
		isLoading: false,
		error: null,
		isLiked: () => false,
		isDisliked: () => false,
		toggleLike: jest.fn(),
		toggleDislike: jest.fn(),
		removeReaction: jest.fn(),
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

jest.mock("@/shared/utils/ratingUtils", () => ({
	formatRatingDisplay: (avg: number, total: number) =>
		total > 0 ? `${avg.toFixed(1)} (${total} rating${total !== 1 ? "s" : ""})` : "No ratings yet",
	formatFollowerCount: (count: number) =>
		count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count),
	roundToHalfStar: (value: number) => Math.round(value * 2) / 2,
	getStarState: (starIndex: number, displayValue: number) => {
		if (displayValue >= starIndex) return "full";
		if (displayValue >= starIndex - 0.5) return "half";
		return "empty";
	},
}));

// ========== MOCK DATA ==========

const mockArtist = {
	_id: "artist-1",
	name: "Test Artist",
	imageUrl: "/artist.jpg",
	bio: "A great test artist",
	genres: ["rock", "pop"],
	followerCount: 1500,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockInteraction = {
	isFollowing: false,
	userRating: 0,
	averageRating: 4.2,
	totalRatings: 15,
};

const mockTracks = {
	items: [
		{
			_id: "track-1",
			title: "Rock Anthem",
			durationInSeconds: 210,
			trackNumber: 1,
			genre: "rock",
			playCount: 5000,
			coverImageUrl: "/cover-1.jpg",
			createdAt: "2024-01-20T00:00:00.000Z",
			updatedAt: "2024-01-20T00:00:00.000Z",
			artistId: { _id: "artist-1", name: "Test Artist", imageUrl: "/artist.jpg" },
			albumId: { _id: "album-1", title: "Test Album", coverImageUrl: "/cover-1.jpg" },
		},
		{
			_id: "track-2",
			title: "Pop Melody",
			durationInSeconds: 195,
			trackNumber: 2,
			genre: "pop",
			playCount: 4500,
			coverImageUrl: "/cover-2.jpg",
			createdAt: "2024-01-20T00:00:00.000Z",
			updatedAt: "2024-01-20T00:00:00.000Z",
			artistId: { _id: "artist-1", name: "Test Artist", imageUrl: "/artist.jpg" },
			albumId: { _id: "album-1", title: "Test Album", coverImageUrl: "/cover-2.jpg" },
		},
	],
	total: 2,
	page: 1,
	limit: 100,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

// ========== TEST WRAPPER ==========

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={["/artist/artist-1"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>
						<Routes>
							<Route path="/artist/:id" element={children} />
						</Routes>
					</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderArtistDetailPage() {
	return render(
		<TestWrapper>
			<ArtistDetailPage />
		</TestWrapper>,
	);
}

// ========== SETUP / TEARDOWN ==========

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

import { artistsService, tracksService } from "@/shared/services";
import { artistInteractionService } from "@/shared/services/artist-interaction.service";

const mockGetById = artistsService.getById as jest.Mock;
const mockGetAllTracks = tracksService.getAll as jest.Mock;
const mockGetInteraction = artistInteractionService.getInteraction as jest.Mock;
const mockToggleFollow = artistInteractionService.toggleFollow as jest.Mock;
const mockRateArtist = artistInteractionService.rateArtist as jest.Mock;

// Helper to wait for the artist page to finish loading (past the skeleton state).
// Uses the h1 heading which is unique to the artist header section.
async function waitForPageLoad(): Promise<void> {
	await waitFor(() => {
		expect(screen.getByRole("heading", { level: 1, name: "Test Artist" })).toBeInTheDocument();
	});
}

// ========== TESTS ==========

const originalConsoleError = console.error;

describe("Artist Detail - Follow & Rating", () => {
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

		// Suppress act() warnings that interfere with waitFor polling
		console.error = (...args: unknown[]) => {
			if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) {
				return;
			}
			originalConsoleError.call(console, ...args);
		};
	});

	afterAll(() => {
		window.location = originalLocation;
		console.error = originalConsoleError;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");

		mockGetById.mockResolvedValue(mockArtist);
		mockGetAllTracks.mockResolvedValue(mockTracks);
		mockGetInteraction.mockResolvedValue(mockInteraction);
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	// ========== ARTIST INFO DISPLAY ==========

	describe("Artist Info Display", () => {
		it("should render artist name and info after loading", async () => {
			renderArtistDetailPage();

			await waitForPageLoad();

			// Verify genres are displayed (capitalized with bullet separator)
			expect(screen.getByText(/Rock \u2022 Pop/)).toBeInTheDocument();

			// Verify follower count is displayed
			expect(screen.getByText(/1\.5K/)).toBeInTheDocument();
			expect(screen.getByText(/followers/)).toBeInTheDocument();

			// Verify tracks section heading
			expect(screen.getByRole("heading", { level: 2, name: /Tracks \(2\)/ })).toBeInTheDocument();
		});

		it("should show loading skeleton while data loads", () => {
			// Make the service never resolve to keep the loading state
			mockGetById.mockImplementation(() => new Promise(() => {}));
			mockGetAllTracks.mockImplementation(() => new Promise(() => {}));

			renderArtistDetailPage();

			// The loading skeleton should have multiple Skeleton placeholders
			const container = document.querySelector(".p-8");
			expect(container).toBeInTheDocument();

			// Heading should NOT be rendered yet (still loading)
			expect(screen.queryByRole("heading", { level: 1, name: "Test Artist" })).not.toBeInTheDocument();
		});

		it("should display formatted follower count", async () => {
			renderArtistDetailPage();

			await waitForPageLoad();

			// 1500 followers should be formatted as "1.5K followers"
			// The follower count and "followers" text are in the same paragraph
			const followerParagraph = screen.getByText(/followers/);
			expect(followerParagraph.textContent).toMatch(/1\.5K/);
		});
	});

	// ========== FOLLOW BUTTON ==========

	describe("Follow Button", () => {
		it("should show Follow button when not following", async () => {
			renderArtistDetailPage();

			await waitForPageLoad();

			// The FollowButton component uses data-testid="follow-button"
			const followButton = screen.getByTestId("follow-button");
			expect(followButton).toBeInTheDocument();
			expect(followButton).toHaveTextContent("Follow");
		});

		it("should call toggleFollow API and update to Following when clicked", async () => {
			const user = userEvent.setup();

			mockToggleFollow.mockResolvedValue({
				isFollowing: true,
				followerCount: 1501,
			});

			renderArtistDetailPage();

			await waitForPageLoad();

			// Wait for the interaction loading to finish so the button is enabled
			await waitFor(() => {
				expect(screen.getByTestId("follow-button")).not.toBeDisabled();
			});

			const followButton = screen.getByTestId("follow-button");
			expect(followButton).toHaveTextContent("Follow");

			// Click to follow
			await user.click(followButton);

			// Verify toggleFollow was called with the artist ID
			expect(mockToggleFollow).toHaveBeenCalledWith("artist-1");

			// After the API resolves, button should reflect the following state.
			// The aria-label switches to "Unfollow artist" when following.
			await waitFor(() => {
				expect(screen.getByTestId("follow-button")).toHaveAttribute("aria-label", "Unfollow artist");
			});
		});
	});

	// ========== RATING DISPLAY ==========

	describe("Rating Display", () => {
		it("should show rating display with average and total", async () => {
			renderArtistDetailPage();

			await waitForPageLoad();

			// The formatRatingDisplay mock returns "4.2 (15 ratings)"
			await waitFor(() => {
				expect(screen.getByText(/4\.2 \(15 ratings\)/)).toBeInTheDocument();
			});
		});

		it("should show star rating component", async () => {
			renderArtistDetailPage();

			await waitForPageLoad();

			// The HalfStarRating component renders with data-testid="rating-input"
			const ratingInput = screen.getByTestId("rating-input");
			expect(ratingInput).toBeInTheDocument();

			// It should have 5 stars (each star has two clickable halves with role="button")
			const starButtons = within(ratingInput).getAllByRole("button");
			// 5 stars x 2 halves = 10 clickable regions
			expect(starButtons).toHaveLength(10);
		});

		it("should call rateArtist API when a star is clicked", async () => {
			const user = userEvent.setup();

			mockRateArtist.mockResolvedValue({
				userRating: 4,
				averageRating: 4.3,
				totalRatings: 16,
			});

			renderArtistDetailPage();

			await waitForPageLoad();

			// Wait for interaction data to load
			await waitFor(() => {
				expect(screen.getByTestId("rating-input")).toBeInTheDocument();
			});

			// Click on the full 4th star (aria-label="Rate 4 stars")
			const fourStarButton = screen.getByLabelText("Rate 4 stars");
			await user.click(fourStarButton);

			// Verify rateArtist was called with the artist ID and rating
			expect(mockRateArtist).toHaveBeenCalledWith("artist-1", 4);

			// After the API resolves, the rating display should update
			await waitFor(() => {
				expect(screen.getByText(/4\.3 \(16 ratings\)/)).toBeInTheDocument();
			});
		});

		it("should show no ratings message when there are no ratings", async () => {
			mockGetInteraction.mockResolvedValue({
				isFollowing: false,
				userRating: 0,
				averageRating: 0,
				totalRatings: 0,
			});

			renderArtistDetailPage();

			await waitForPageLoad();

			// The formatRatingDisplay mock returns "No ratings yet" when total is 0
			await waitFor(() => {
				expect(screen.getByText(/No ratings yet/)).toBeInTheDocument();
			});
		});
	});
});
