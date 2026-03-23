// @ts-nocheck
import type { Mock } from "vitest";
import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ConcertsPage from "@/pages/ConcertsPage";
import ConcertDetailPage from "@/pages/ConcertDetailPage";

// ========== MOCKS ==========

vi.mock("embla-carousel-react", () => ({
	__esModule: true,
	default: vi.fn(() => [
		vi.fn(),
		{
			on: vi.fn(),
			off: vi.fn(),
			canScrollPrev: vi.fn(() => false),
			canScrollNext: vi.fn(() => false),
			scrollPrev: vi.fn(),
			scrollNext: vi.fn(),
		},
	]),
}));

vi.mock("@/shared/services", () => ({
	artistsService: {
		getAll: vi.fn(),
	},
	albumsService: {
		getAll: vi.fn(),
	},
	tracksService: {
		getAll: vi.fn(),
	},
}));

vi.mock("@/shared/contexts/AuthContext", () => ({
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
	useAuth: () => ({
		user: { _id: "user-1", email: "test@melodio.com", name: "Test User" },
		isAuthenticated: true,
		isLoading: false,
		login: vi.fn(),
		register: vi.fn(),
		logout: vi.fn(),
	}),
}));

vi.mock("@/shared/contexts/SidebarContext", () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
	useSidebar: () => ({
		isMobileSidebarOpen: false,
		toggleMobileSidebar: vi.fn(),
		closeMobileSidebar: vi.fn(),
	}),
}));

vi.mock("@/shared/contexts/PlayerContext", () => ({
	PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
	usePlayer: () => ({
		state: { currentTrack: null, isPlaying: false, queue: [], volume: 1, isMuted: false, currentTime: 0, duration: 0, repeat: "off", shuffle: false },
		playTrack: vi.fn(),
		togglePlayPause: vi.fn(),
		pauseTrack: vi.fn(),
		resumeTrack: vi.fn(),
		setVolume: vi.fn(),
		seekTo: vi.fn(),
		playNext: vi.fn(),
		playPrevious: vi.fn(),
		addToQueue: vi.fn(),
		removeFromQueue: vi.fn(),
		clearQueue: vi.fn(),
		setRepeat: vi.fn(),
		toggleShuffle: vi.fn(),
		toggleMute: vi.fn(),
	}),
}));

vi.mock("@/shared/hooks/useToast", () => ({
	ToastProvider: ({ children }: { children: React.ReactNode }) => children,
	useToast: () => ({
		toasts: [],
		addToast: vi.fn(),
		removeToast: vi.fn(),
	}),
}));

vi.mock("@/lib/utils", () => ({
	cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
}));

vi.mock("@/shared/utils", () => ({
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
	preloadImages: vi.fn(),
	debounce: (func: any, wait: number) => func,
	generateId: () => Math.random().toString(36).substring(2, 11),
	sleep: (ms: number) => new Promise((resolve: any) => setTimeout(resolve, ms)),
}));

// ========== SERVICE IMPORTS (after mock) ==========

import { artistsService, albumsService, tracksService } from "@/shared/services";

const mockGetAllArtists = artistsService.getAll as Mock;
const mockGetAllAlbums = albumsService.getAll as Mock;
const mockGetAllTracks = tracksService.getAll as Mock;

// ========== FACTORY FUNCTIONS ==========

function createMockConcert(
	id: string,
	artistId: string,
	artistName: string,
	venue: string,
	city: string,
	date: string,
	time: string,
	tickets: any[] = [],
) {
	return {
		_id: id,
		artistId: {
			_id: artistId,
			name: artistName,
			imageUrl: `/artist-${artistId}.jpg`,
		},
		venue,
		city,
		date,
		time,
		coverImage: `/images/concerts/${id}.jpg`,
		maxTicketsPerUser: 6,
		tickets,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	};
}

function createPaginatedResponse(items: any[]) {
	return {
		items,
		total: items.length,
		page: 1,
		limit: 100,
		totalPages: 1,
		hasNext: false,
		hasPrev: false,
	};
}

// ========== MOCK DATA ==========

const FUTURE_YEAR = new Date().getUTCFullYear() + 2;

const mockConcerts = [
	createMockConcert("c1", "a1", "The Amplifiers", "Madison Square Garden", "New York", `${FUTURE_YEAR}-03-15`, "19:30"),
	createMockConcert("c2", "a2", "Neon Dreams", "T-Mobile Arena", "Las Vegas", `${FUTURE_YEAR}-04-12`, "21:00"),
	createMockConcert("c3", "a3", "Urban Beats", "The Forum", "Los Angeles", `${FUTURE_YEAR}-03-08`, "19:00"),
	createMockConcert("c4", "a1", "The Amplifiers", "Soldier Field", "Chicago", `${FUTURE_YEAR}-10-22`, "18:00"),
	createMockConcert("c5", "a4", "Blue Note Quartet", "Blue Note Jazz Club", "New York", `${FUTURE_YEAR}-05-22`, "20:00"),
	createMockConcert("c6", "a5", "Velvet Grooves", "Crypto.com Arena", "Los Angeles", `${FUTURE_YEAR}-12-12`, "20:00"),
	createMockConcert("c7", "a3", "Urban Beats", "House of Blues", "Chicago", "2024-06-15", "15:00"),
];

const mockArtists = [
	{ _id: "a1", name: "The Amplifiers", imageUrl: "/a1.jpg", followerCount: 500000, genres: ["rock"] },
	{ _id: "a2", name: "Neon Dreams", imageUrl: "/a2.jpg", followerCount: 300000, genres: ["electronic"] },
	{ _id: "a3", name: "Urban Beats", imageUrl: "/a3.jpg", followerCount: 200000, genres: ["hip-hop"] },
	{ _id: "a4", name: "Blue Note Quartet", imageUrl: "/a4.jpg", followerCount: 150000, genres: ["jazz"] },
	{ _id: "a5", name: "Velvet Grooves", imageUrl: "/a5.jpg", followerCount: 250000, genres: ["r-and-b"] },
];

const mockAlbums = [
	{
		_id: "alb1",
		title: "Electric Storm",
		artistId: { _id: "a1", name: "The Amplifiers" },
		coverImageUrl: "/cover-alb1.jpg",
		totalTracks: 10,
		releaseDate: "2024-01-15",
		createdAt: "2024-01-15T00:00:00Z",
		updatedAt: "2024-01-15T00:00:00Z",
	},
	{
		_id: "alb2",
		title: "Neon Nights",
		artistId: { _id: "a2", name: "Neon Dreams" },
		coverImageUrl: "/cover-alb2.jpg",
		totalTracks: 8,
		releaseDate: "2024-03-20",
		createdAt: "2024-03-20T00:00:00Z",
		updatedAt: "2024-03-20T00:00:00Z",
	},
	{
		_id: "alb3",
		title: "City Streets",
		artistId: { _id: "a3", name: "Urban Beats" },
		coverImageUrl: "/cover-alb3.jpg",
		totalTracks: 12,
		releaseDate: "2024-06-01",
		createdAt: "2024-06-01T00:00:00Z",
		updatedAt: "2024-06-01T00:00:00Z",
	},
];

const mockTracks = [
	{
		_id: "t1",
		title: "Rock Anthem",
		durationInSeconds: 210,
		trackNumber: 1,
		genre: "rock",
		playCount: 50000,
		createdAt: "2024-01-20T00:00:00Z",
		updatedAt: "2024-01-20T00:00:00Z",
		coverImageUrl: "/cover-t1.jpg",
		artistId: { _id: "a1", name: "The Amplifiers", imageUrl: "/a1.jpg" },
		albumId: { _id: "alb1", title: "Electric Storm", coverImageUrl: "/cover-alb1.jpg" },
	},
	{
		_id: "t2",
		title: "Rock Ballad",
		durationInSeconds: 195,
		trackNumber: 2,
		genre: "rock",
		playCount: 30000,
		createdAt: "2024-01-20T00:00:00Z",
		updatedAt: "2024-01-20T00:00:00Z",
		coverImageUrl: "/cover-t2.jpg",
		artistId: { _id: "a1", name: "The Amplifiers", imageUrl: "/a1.jpg" },
		albumId: { _id: "alb1", title: "Electric Storm", coverImageUrl: "/cover-alb1.jpg" },
	},
	{
		_id: "t3",
		title: "Electro Beat",
		durationInSeconds: 240,
		trackNumber: 1,
		genre: "electronic",
		playCount: 40000,
		createdAt: "2024-03-20T00:00:00Z",
		updatedAt: "2024-03-20T00:00:00Z",
		coverImageUrl: "/cover-t3.jpg",
		artistId: { _id: "a2", name: "Neon Dreams", imageUrl: "/a2.jpg" },
		albumId: { _id: "alb2", title: "Neon Nights", coverImageUrl: "/cover-alb2.jpg" },
	},
	{
		_id: "t4",
		title: "Hip Hop Flow",
		durationInSeconds: 250,
		trackNumber: 1,
		genre: "hip-hop",
		playCount: 25000,
		createdAt: "2024-06-01T00:00:00Z",
		updatedAt: "2024-06-01T00:00:00Z",
		coverImageUrl: "/cover-t4.jpg",
		artistId: { _id: "a3", name: "Urban Beats", imageUrl: "/a3.jpg" },
		albumId: { _id: "alb3", title: "City Streets", coverImageUrl: "/cover-alb3.jpg" },
	},
];

// ========== TEST WRAPPERS ==========

function ListingWrapper({ children }: { children: React.ReactNode }) {
	return <MemoryRouter initialEntries={["/concerts"]}>{children}</MemoryRouter>;
}

function DetailWrapper({ concertId = "c1", children }: { concertId?: string; children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={[`/concerts/${concertId}`]}>
			<Routes>
				<Route path="/concerts/:id" element={children} />
				<Route path="/concerts" element={<div data-testid="concerts-page">Listing</div>} />
			</Routes>
		</MemoryRouter>
	);
}

// ========== SETUP / TEARDOWN ==========

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: Mock;

describe("Live Music Concerts", () => {
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
		mockFetch = vi.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe("Concerts Page", () => {
		function setupListingMocks() {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/concerts")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve({ success: true, data: mockConcerts }),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve({ success: true, data: [] }),
				});
			});
			mockGetAllArtists.mockResolvedValue(createPaginatedResponse(mockArtists));
		}

		it("should sort upcoming concerts by date descending", async () => {
			setupListingMocks();

			// Render concerts page
			render(
				<ListingWrapper>
					<ConcertsPage />
				</ListingWrapper>,
			);

			// Wait for upcoming section
			await waitFor(() => {
				expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
			});

			// Get concert card IDs
			const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
			const cardIds = concertCards.map((card) => card.getAttribute("data-testid"));

			// Verify sorted by date descending
			expect(cardIds).toEqual([
				"concerts-card-c6",
				"concerts-card-c4",
				"concerts-card-c5",
				"concerts-card-c2",
				"concerts-card-c1",
				"concerts-card-c3",
			]);
		});

		describe("Month Filter", () => {
			it("should filter concerts by month", async () => {
				setupListingMocks();
				const user = userEvent.setup();

				// Render concerts page
				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				// Wait for upcoming section
				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				// Open month filter and select March
				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-3"));

				// Verify filtered to 2 March concerts
				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(2);
				});

				// Verify correct concerts shown and others hidden
				expect(screen.getByTestId("concerts-card-c1")).toBeInTheDocument();
				expect(screen.getByTestId("concerts-card-c3")).toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c4")).not.toBeInTheDocument();
			});

			it("should show empty state for month with no concerts", async () => {
				setupListingMocks();
				const user = userEvent.setup();

				// Render concerts page
				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				// Wait for upcoming section
				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				// Open month filter and select November
				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-11"));

				// Verify no concert cards shown
				await waitFor(() => {
					expect(screen.queryAllByTestId(/^concerts-card-c\d$/)).toHaveLength(0);
				});

				// Verify empty state message
				expect(screen.getByText("No concerts found for this month.")).toBeInTheDocument();
			});

			it("should show all concerts when All is selected", async () => {
				setupListingMocks();
				const user = userEvent.setup();

				// Render concerts page
				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				// Wait for upcoming section
				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				// Filter by March first
				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-3"));

				// Verify filtered to 2 concerts
				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(2);
				});

				// Select "All" to clear filter
				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-0"));

				// Verify all 6 concerts restored
				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(6);
				});
			});
		});

		it("should display date badge with month and day", async () => {
			setupListingMocks();

			// Render concerts page
			render(
				<ListingWrapper>
					<ConcertsPage />
				</ListingWrapper>,
			);

			// Wait for date badge to render
			await waitFor(() => {
				expect(screen.getByTestId("concerts-card-date-c1")).toBeInTheDocument();
			});

			// Verify month and day displayed
			const badge = screen.getByTestId("concerts-card-date-c1");
			expect(badge.children[0]).toHaveTextContent("Mar");
			expect(badge.children[1]).toHaveTextContent("15");
		});

		it("should display time in 12-hour format", async () => {
			setupListingMocks();

			// Render concerts page
			render(
				<ListingWrapper>
					<ConcertsPage />
				</ListingWrapper>,
			);

			// Wait for time element to render
			await waitFor(() => {
				expect(screen.getByTestId("concerts-card-time-c1")).toBeInTheDocument();
			});

			// Verify 12-hour format
			expect(screen.getByTestId("concerts-card-time-c1")).toHaveTextContent("7:30 PM");
		});

		it("should exclude past concerts", async () => {
			setupListingMocks();

			// Render concerts page
			render(
				<ListingWrapper>
					<ConcertsPage />
				</ListingWrapper>,
			);

			// Wait for upcoming section
			await waitFor(() => {
				expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
			});

			// Verify past concert excluded
			expect(screen.queryByTestId("concerts-card-c7")).not.toBeInTheDocument();
		});

		it("should filter artists by city", async () => {
			setupListingMocks();
			const user = userEvent.setup();

			// Render concerts page
			render(
				<ListingWrapper>
					<ConcertsPage />
				</ListingWrapper>,
			);

			// Wait for city chips
			await waitFor(() => {
				expect(screen.getByTestId("concerts-city-chips")).toBeInTheDocument();
			});

			// Click New York city chip
			await user.click(screen.getByTestId("concerts-city-chip-new-york"));

			// Verify artists in New York shown
			await waitFor(() => {
				expect(screen.getByTestId("concerts-artist-a1")).toBeInTheDocument();
				expect(screen.getByTestId("concerts-artist-a4")).toBeInTheDocument();
			});

			// Verify artists not in New York hidden
			expect(screen.queryByTestId("concerts-artist-a2")).not.toBeInTheDocument();
			expect(screen.queryByTestId("concerts-artist-a3")).not.toBeInTheDocument();
			expect(screen.queryByTestId("concerts-artist-a5")).not.toBeInTheDocument();
		});
	});

	describe("Concert Detail Page", () => {
		const detailConcert = createMockConcert(
			"c1",
			"a1",
			"The Amplifiers",
			"Madison Square Garden",
			"New York",
			"2026-03-15",
			"19:30",
		);

		function setupDetailMocks(concert = detailConcert, userTickets: any[] = []) {
			mockFetch.mockImplementation((url: string, options?: any) => {
				if (url.match(/\/api\/concerts\/[^/]+\/tickets/) && options?.method === "POST") {
					const body = JSON.parse(options.body);
					const quantity = body.quantity || 1;
					const newTicketCodes = Array.from({ length: quantity }, (_, i) => `CONC-${concert._id.slice(-4)}-ticket${i + 1}`);

					const newTicket = {
						userId: "user-1",
						quantity,
						ticketCodes: newTicketCodes,
						purchasedAt: new Date().toISOString(),
					};

					const updatedConcert = {
						...concert,
						tickets: [...concert.tickets, newTicket],
					};

					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve({
								success: true,
								data: {
									concert: updatedConcert,
									userTickets: [...userTickets, newTicket],
								},
							}),
					});
				}

				if (url.match(/\/api\/concerts\/[^/]+\/tickets/)) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve({ success: true, data: userTickets }),
					});
				}

				if (url.match(/\/api\/concerts\/[^/]+$/)) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve({ success: true, data: concert }),
					});
				}

				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve({ success: true, data: [] }),
				});
			});

			mockGetAllAlbums.mockResolvedValue(createPaginatedResponse(mockAlbums));
			mockGetAllTracks.mockResolvedValue(createPaginatedResponse(mockTracks));
		}

		it("should display concert date in short format", async () => {
			setupDetailMocks();

			// Render concert detail page
			render(
				<DetailWrapper concertId="c1">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for date element
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-date")).toBeInTheDocument();
			});

			// Verify short date format
			expect(screen.getByTestId("concert-detail-date")).toHaveTextContent("Mar 15");
		});

		it("should display detail time in 12-hour format", async () => {
			setupDetailMocks();

			// Render concert detail page
			render(
				<DetailWrapper concertId="c1">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for time element
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-time")).toBeInTheDocument();
			});

			// Verify 12-hour format
			expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("7:30 PM");
		});

		it("should format midnight '00:00' as '12:00 AM'", async () => {
			// Create concert at midnight
			const midnightConcert = createMockConcert(
				"c-midnight",
				"a1",
				"The Amplifiers",
				"Late Night Venue",
				"New York",
				"2026-06-01",
				"00:00",
			);
			setupDetailMocks(midnightConcert);

			// Render concert detail page
			render(
				<DetailWrapper concertId="c-midnight">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for time element
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-time")).toBeInTheDocument();
			});

			// Verify midnight formatted as 12:00 AM
			expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("12:00 AM");
		});

		it("should format noon '12:00' as '12:00 PM'", async () => {
			// Create concert at noon
			const noonConcert = createMockConcert(
				"c-noon",
				"a2",
				"Neon Dreams",
				"Noon Stage",
				"Los Angeles",
				"2026-07-04",
				"12:00",
			);
			setupDetailMocks(noonConcert);

			// Render concert detail page
			render(
				<DetailWrapper concertId="c-noon">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for time element
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-time")).toBeInTheDocument();
			});

			// Verify noon formatted as 12:00 PM
			expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("12:00 PM");
		});

		it("should show albums for the concert artist", async () => {
			setupDetailMocks();

			// Render concert detail page
			render(
				<DetailWrapper concertId="c1">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for albums section
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-albums")).toBeInTheDocument();
			});

			// Verify artist's album displayed
			const albumItems = screen.getAllByTestId(/^concert-detail-album-/);
			expect(albumItems).toHaveLength(1);
			expect(screen.getByTestId("concert-detail-album-alb1")).toBeInTheDocument();
		});

		it("should show tracks for the concert artist", async () => {
			setupDetailMocks();

			// Render concert detail page
			render(
				<DetailWrapper concertId="c1">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for tracks section
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-tracks")).toBeInTheDocument();
			});

			// Verify artist's tracks displayed
			const trackItems = screen.getAllByTestId(/^concert-detail-track-/);
			expect(trackItems).toHaveLength(2);
		});

		describe("Buy Ticket Dialog", () => {
			it("should show available tickets in dialog", async () => {
				setupDetailMocks();
				const user = userEvent.setup();

				// Render concert detail page
				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				// Wait for buy button
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
				});

				// Open buy dialog
				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				// Verify available ticket count
				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-available")).toHaveTextContent(/Available: 6 tickets remaining/i);
				});
			});

			it("should increment ticket quantity", async () => {
				setupDetailMocks();
				const user = userEvent.setup();

				// Render concert detail page
				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				// Wait for buy button
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
				});

				// Open buy dialog
				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				// Verify initial quantity is 1
				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("1");
				});

				// Click increment
				await user.click(screen.getByTestId("concert-buy-increment"));

				// Verify quantity increased to 2
				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("2");
				});
			});

			it("should disable decrement at minimum", async () => {
				setupDetailMocks();
				const user = userEvent.setup();

				// Render concert detail page
				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				// Wait for buy button
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
				});

				// Open buy dialog
				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				// Verify decrement disabled at minimum quantity
				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-decrement")).toBeDisabled();
				});
			});
		});

		it("should update ticket count after purchase", async () => {
			setupDetailMocks();
			const user = userEvent.setup();

			// Render concert detail page
			render(
				<DetailWrapper concertId="c1">
					<ConcertDetailPage />
				</DetailWrapper>,
			);

			// Wait for buy button
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
			});

			// Verify initial ticket count
			expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("0/6 tickets");

			// Open buy dialog
			await user.click(screen.getByTestId("concert-detail-buy-btn"));

			// Wait for dialog
			await waitFor(() => {
				expect(screen.getByTestId("concert-buy-dialog")).toBeInTheDocument();
			});

			// Confirm purchase
			await user.click(screen.getByTestId("concert-buy-confirm"));

			// Verify ticket count updated
			await waitFor(() => {
				expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("1/6 tickets");
			});
		});

		describe("Ticket Limits", () => {
			it("should hide buy button at ticket limit", async () => {
				// Create concert with max tickets purchased
				const maxedConcert = createMockConcert(
					"c1",
					"a1",
					"The Amplifiers",
					"Madison Square Garden",
					"New York",
					"2026-03-15",
					"19:30",
					[
						{
							userId: "user-1",
							quantity: 2,
							ticketCodes: ["CONC-00c1-a", "CONC-00c1-b"],
							purchasedAt: "2026-01-10T10:00:00Z",
						},
						{
							userId: "user-1",
							quantity: 4,
							ticketCodes: ["CONC-00c1-c", "CONC-00c1-d", "CONC-00c1-e", "CONC-00c1-f"],
							purchasedAt: "2026-01-12T10:00:00Z",
						},
					],
				);

				setupDetailMocks(maxedConcert);

				// Render concert detail page
				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				// Verify ticket count at max
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("6/6 tickets");
				});

				// Verify buy button hidden
				expect(screen.queryByTestId("concert-detail-buy-btn")).not.toBeInTheDocument();
			});

			it("should show buy button with partial tickets", async () => {
				// Create concert with some tickets purchased
				const partialConcert = createMockConcert(
					"c1",
					"a1",
					"The Amplifiers",
					"Madison Square Garden",
					"New York",
					"2026-03-15",
					"19:30",
					[
						{
							userId: "user-1",
							quantity: 3,
							ticketCodes: ["CONC-00c1-x", "CONC-00c1-y", "CONC-00c1-z"],
							purchasedAt: "2026-01-15T10:00:00Z",
						},
					],
				);

				setupDetailMocks(partialConcert);

				// Render concert detail page
				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				// Verify partial ticket count
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("3/6 tickets");
				});

				// Verify buy button still visible
				expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
			});
		});

		describe("View Tickets Dialog", () => {
			it("should display ticket codes in dialog", async () => {
				// Setup concert with 3 tickets
				const ticketsData = [
					{
						userId: "user-1",
						quantity: 3,
						ticketCodes: ["CONC-00c1-abc123", "CONC-00c1-def456", "CONC-00c1-ghi789"],
						purchasedAt: "2026-01-15T10:00:00Z",
					},
				];

				const concertWithTickets = createMockConcert(
					"c1",
					"a1",
					"The Amplifiers",
					"Madison Square Garden",
					"New York",
					"2026-03-15",
					"19:30",
					ticketsData,
				);

				setupDetailMocks(concertWithTickets, ticketsData);
				const user = userEvent.setup();

				// Render concert detail page
				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				// Wait for view tickets button
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-view-tickets-btn")).toBeInTheDocument();
				});

				// Click view tickets
				await user.click(screen.getByTestId("concert-detail-view-tickets-btn"));

				// Wait for tickets dialog
				await waitFor(() => {
					expect(screen.getByTestId("concert-tickets-dialog")).toBeInTheDocument();
				});

				// Verify all ticket codes displayed
				expect(screen.getByTestId("concert-ticket-CONC-00c1-abc123")).toBeInTheDocument();
				expect(screen.getByTestId("concert-ticket-CONC-00c1-def456")).toBeInTheDocument();
				expect(screen.getByTestId("concert-ticket-CONC-00c1-ghi789")).toBeInTheDocument();
			});
		});
	});
});
