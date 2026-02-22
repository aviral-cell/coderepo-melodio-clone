// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ConcertsPage from "@/pages/ConcertsPage";
import ConcertDetailPage from "@/pages/ConcertDetailPage";

// ========== MOCKS ==========

jest.mock("embla-carousel-react", () => ({
	__esModule: true,
	default: jest.fn(() => [
		jest.fn(),
		{
			on: jest.fn(),
			off: jest.fn(),
			canScrollPrev: jest.fn(() => false),
			canScrollNext: jest.fn(() => false),
			scrollPrev: jest.fn(),
			scrollNext: jest.fn(),
		},
	]),
}));

jest.mock("@/shared/services", () => ({
	artistsService: {
		getAll: jest.fn(),
	},
	albumsService: {
		getAll: jest.fn(),
	},
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

jest.mock("@/shared/contexts/PlayerContext", () => ({
	PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
	usePlayer: () => ({
		state: { currentTrack: null, isPlaying: false, queue: [], volume: 1, isMuted: false, currentTime: 0, duration: 0, repeat: "off", shuffle: false },
		playTrack: jest.fn(),
		togglePlayPause: jest.fn(),
		pauseTrack: jest.fn(),
		resumeTrack: jest.fn(),
		setVolume: jest.fn(),
		seekTo: jest.fn(),
		playNext: jest.fn(),
		playPrevious: jest.fn(),
		addToQueue: jest.fn(),
		removeFromQueue: jest.fn(),
		clearQueue: jest.fn(),
		setRepeat: jest.fn(),
		toggleShuffle: jest.fn(),
		toggleMute: jest.fn(),
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

// ========== SERVICE IMPORTS (after mock) ==========

import { artistsService, albumsService, tracksService } from "@/shared/services";

const mockGetAllArtists = artistsService.getAll as jest.Mock;
const mockGetAllAlbums = albumsService.getAll as jest.Mock;
const mockGetAllTracks = tracksService.getAll as jest.Mock;

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

const mockConcerts = [
	createMockConcert("c1", "a1", "The Amplifiers", "Madison Square Garden", "New York", "2026-03-15", "19:30"),
	createMockConcert("c2", "a2", "Neon Dreams", "T-Mobile Arena", "Las Vegas", "2026-04-12", "21:00"),
	createMockConcert("c3", "a3", "Urban Beats", "The Forum", "Los Angeles", "2026-03-08", "19:00"),
	createMockConcert("c4", "a1", "The Amplifiers", "Soldier Field", "Chicago", "2026-10-22", "18:00"),
	createMockConcert("c5", "a4", "Blue Note Quartet", "Blue Note Jazz Club", "New York", "2026-05-22", "20:00"),
	createMockConcert("c6", "a5", "Velvet Grooves", "Crypto.com Arena", "Los Angeles", "2026-12-12", "20:00"),
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

let mockFetch: jest.Mock;

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
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	// ========== CONCERTS PAGE (LISTING) TESTS ==========

	describe("ConcertsPage", () => {
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

		describe("Sort Order", () => {
			it("12.1 - should display concerts sorted descending by date with furthest future first", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				// Expected descending sort order: c6 (Dec 12), c4 (Oct 22), c5 (May 22), c2 (Apr 12), c1 (Mar 15), c3 (Mar 8)
				const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
				const cardIds = concertCards.map((card) => card.getAttribute("data-testid"));

				expect(cardIds).toEqual([
					"concerts-card-c6",
					"concerts-card-c4",
					"concerts-card-c5",
					"concerts-card-c2",
					"concerts-card-c1",
					"concerts-card-c3",
				]);
			});
		});

		describe("Month Filter", () => {
			it("12.2 - should filter concerts to selected month only when month dropdown changes", async () => {
				setupListingMocks();
				const user = userEvent.setup();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				// Open the DropdownMenu by clicking the trigger
				await user.click(screen.getByTestId("concerts-month-filter"));

				// Click "March" option (value = 3)
				await user.click(screen.getByTestId("concerts-month-option-3"));

				// March concerts: c1 (Mar 15) and c3 (Mar 8)
				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(2);
				});

				// Verify correct March concerts are shown (sorted desc: c1 first then c3)
				expect(screen.getByTestId("concerts-card-c1")).toBeInTheDocument();
				expect(screen.getByTestId("concerts-card-c3")).toBeInTheDocument();

				// Verify non-March concerts are not shown
				expect(screen.queryByTestId("concerts-card-c2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c4")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c5")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c6")).not.toBeInTheDocument();
			});

			it("12.3 - should show all upcoming concerts when 'All' month option is selected", async () => {
				setupListingMocks();
				const user = userEvent.setup();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				// First filter to March
				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-3"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(2);
				});

				// Then select "All" (value = 0)
				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-0"));

				// All 6 concerts should be visible again
				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(6);
				});
			});
		});

		describe("City Chip Filter", () => {
			it("12.4 - should filter artists correctly when a city chip is clicked", async () => {
				setupListingMocks();
				const user = userEvent.setup();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-city-chips")).toBeInTheDocument();
				});

				// Click "New York" city chip
				await user.click(screen.getByTestId("concerts-city-chip-new-york"));

				// New York has concerts for a1 (The Amplifiers) and a4 (Blue Note Quartet)
				await waitFor(() => {
					expect(screen.getByTestId("concerts-artist-a1")).toBeInTheDocument();
					expect(screen.getByTestId("concerts-artist-a4")).toBeInTheDocument();
				});

				// Artists not in New York should not appear
				expect(screen.queryByTestId("concerts-artist-a2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-artist-a3")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-artist-a5")).not.toBeInTheDocument();
			});
		});

		describe("Date Format", () => {
			it("12.5 - should display concert dates as calendar badge with month and day", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-date-c1")).toBeInTheDocument();
				});

				// Date badge renders month + day in separate child divs
				// "2026-03-15" => month "Mar", day "15"
				const badge1 = screen.getByTestId("concerts-card-date-c1");
				expect(badge1).toHaveTextContent(/Mar/i);
				expect(badge1).toHaveTextContent("15");

				// "2026-04-12" => month "Apr", day "12"
				const badge2 = screen.getByTestId("concerts-card-date-c2");
				expect(badge2).toHaveTextContent(/Apr/i);
				expect(badge2).toHaveTextContent("12");

				// "2026-03-08" => month "Mar", day "8"
				const badge3 = screen.getByTestId("concerts-card-date-c3");
				expect(badge3).toHaveTextContent(/Mar/i);
				expect(badge3).toHaveTextContent("8");

				// "2026-10-22" => month "Oct", day "22"
				const badge4 = screen.getByTestId("concerts-card-date-c4");
				expect(badge4).toHaveTextContent(/Oct/i);
				expect(badge4).toHaveTextContent("22");
			});
		});

		describe("Time Format", () => {
			it("12.6 - should display concert times in 12-hour format", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-time-c1")).toBeInTheDocument();
				});

				// "19:30" should be "7:30 PM"
				expect(screen.getByTestId("concerts-card-time-c1")).toHaveTextContent("7:30 PM");

				// "21:00" should be "9:00 PM"
				expect(screen.getByTestId("concerts-card-time-c2")).toHaveTextContent("9:00 PM");

				// "19:00" should be "7:00 PM"
				expect(screen.getByTestId("concerts-card-time-c3")).toHaveTextContent("7:00 PM");

				// "18:00" should be "6:00 PM"
				expect(screen.getByTestId("concerts-card-time-c4")).toHaveTextContent("6:00 PM");

				// "20:00" should be "8:00 PM"
				expect(screen.getByTestId("concerts-card-time-c5")).toHaveTextContent("8:00 PM");
			});
		});

		describe("Concert Card Navigation", () => {
			it("12.7 - should have concert card links pointing to the detail page", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-c1")).toBeInTheDocument();
				});

				// Concert card c1 should be a link to /concerts/c1
				const cardLink = screen.getByTestId("concerts-card-c1");
				expect(cardLink.closest("a")).toHaveAttribute("href", "/concerts/c1");

				// Concert card c2 should be a link to /concerts/c2
				const cardLink2 = screen.getByTestId("concerts-card-c2");
				expect(cardLink2.closest("a")).toHaveAttribute("href", "/concerts/c2");
			});
		});
	});

	// ========== CONCERT DETAIL PAGE TESTS ==========

	describe("ConcertDetailPage", () => {
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
				// Buy tickets endpoint (POST)
				if (url.match(/\/api\/concerts\/[^/]+\/tickets/) && options?.method === "POST") {
					const body = JSON.parse(options.body);
					const quantity = body.quantity || 1;
					const newTicketCodes = Array.from({ length: quantity }, (_, i) => `CONC-${concert._id.slice(-4)}-ticket${i + 1}`);
					const existingUserTickets = concert.tickets.filter((t: any) => t.userId === "user-1");
					const existingCount = existingUserTickets.reduce((sum: number, t: any) => sum + t.quantity, 0);

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

				// Get user tickets endpoint (GET)
				if (url.match(/\/api\/concerts\/[^/]+\/tickets/)) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve({ success: true, data: userTickets }),
					});
				}

				// Get concert detail endpoint
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

		describe("Detail Display", () => {
			it("12.8 - should display venue, date without year, and time in 12-hour format", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-page")).toBeInTheDocument();
					expect(screen.getByTestId("concert-detail-venue")).toBeInTheDocument();
				});

				// Venue
				expect(screen.getByTestId("concert-detail-venue")).toHaveTextContent("Madison Square Garden");

				// Date without year: "Mar 15"
				expect(screen.getByTestId("concert-detail-date")).toHaveTextContent("Mar 15");

				// Time in 12-hour format: "7:30 PM"
				expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("7:30 PM");

				// Artist name
				expect(screen.getByTestId("concert-detail-artist")).toHaveTextContent("The Amplifiers");

				// City
				expect(screen.getByTestId("concert-detail-city")).toHaveTextContent("New York");
			});
		});

		describe("Artist Albums Carousel", () => {
			it("12.9 - should show only the concert artist's albums", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-albums")).toBeInTheDocument();
				});

				// Concert c1 has artist a1 (The Amplifiers), only alb1 belongs to a1
				expect(screen.getByTestId("concert-detail-album-alb1")).toBeInTheDocument();

				// Albums from other artists should not appear
				expect(screen.queryByTestId("concert-detail-album-alb2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concert-detail-album-alb3")).not.toBeInTheDocument();
			});
		});

		describe("Artist Tracks Carousel", () => {
			it("12.10 - should show only the concert artist's tracks", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-tracks")).toBeInTheDocument();
				});

				// Concert c1 has artist a1 (The Amplifiers), tracks t1 and t2 belong to a1
				expect(screen.getByTestId("concert-detail-track-t1")).toBeInTheDocument();
				expect(screen.getByTestId("concert-detail-track-t2")).toBeInTheDocument();

				// Tracks from other artists should not appear
				expect(screen.queryByTestId("concert-detail-track-t3")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concert-detail-track-t4")).not.toBeInTheDocument();
			});
		});

		describe("Buy Ticket Dialog", () => {
			it("12.11 - should open buy ticket dialog with quantity controls when buy button is clicked", async () => {
				setupDetailMocks();
				const user = userEvent.setup();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
				});

				// Click buy button
				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				// Dialog should appear
				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-dialog")).toBeInTheDocument();
				});

				// Default quantity should be 1
				expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("1");

				// Available tickets message: "Available: 6 tickets remaining"
				expect(screen.getByTestId("concert-buy-available")).toHaveTextContent(/Available: 6 tickets remaining/i);

				// Increment and decrement buttons should be present
				expect(screen.getByTestId("concert-buy-increment")).toBeInTheDocument();
				expect(screen.getByTestId("concert-buy-decrement")).toBeInTheDocument();

				// Confirm button should be present
				expect(screen.getByTestId("concert-buy-confirm")).toBeInTheDocument();
			});

			it("12.12 - should update ticket count after successful purchase", async () => {
				setupDetailMocks();
				const user = userEvent.setup();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
				});

				// Initially 0/6 tickets
				expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("0/6 tickets");

				// Open buy dialog
				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-dialog")).toBeInTheDocument();
				});

				// Increment quantity to 2
				await user.click(screen.getByTestId("concert-buy-increment"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("2");
				});

				// Confirm purchase
				await user.click(screen.getByTestId("concert-buy-confirm"));

				// Ticket count should update to reflect purchased tickets
				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("2/6 tickets");
				});

				// View tickets button should now appear
				expect(screen.getByTestId("concert-detail-view-tickets-btn")).toBeInTheDocument();
			});
		});

		describe("Max Tickets Limit", () => {
			it("12.13 - should hide buy button when user has reached the 6-ticket limit", async () => {
				// Create a concert where user-1 already has 6 tickets
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
							quantity: 6,
							ticketCodes: ["CONC-0001-a", "CONC-0001-b", "CONC-0001-c", "CONC-0001-d", "CONC-0001-e", "CONC-0001-f"],
							purchasedAt: "2026-01-15T10:00:00Z",
						},
					],
				);

				setupDetailMocks(maxedConcert);

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("6/6 tickets");
				});

				// Buy button should NOT be in the DOM
				expect(screen.queryByTestId("concert-detail-buy-btn")).not.toBeInTheDocument();

				// View tickets button should be visible
				expect(screen.getByTestId("concert-detail-view-tickets-btn")).toBeInTheDocument();
			});
		});

		describe("View Tickets Dialog", () => {
			it("12.14 - should display ticket cards with codes in the view tickets dialog", async () => {
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

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-view-tickets-btn")).toBeInTheDocument();
				});

				// Click view tickets button
				await user.click(screen.getByTestId("concert-detail-view-tickets-btn"));

				// Dialog should appear
				await waitFor(() => {
					expect(screen.getByTestId("concert-tickets-dialog")).toBeInTheDocument();
				});

				// Ticket carousel should be present
				expect(screen.getByTestId("concert-ticket-carousel")).toBeInTheDocument();

				// 3 ticket cards should be displayed with their codes
				expect(screen.getByTestId("concert-ticket-CONC-00c1-abc123")).toBeInTheDocument();
				expect(screen.getByTestId("concert-ticket-CONC-00c1-def456")).toBeInTheDocument();
				expect(screen.getByTestId("concert-ticket-CONC-00c1-ghi789")).toBeInTheDocument();
			});
		});

		describe("Back Button", () => {
			it("12.15 - should have a back button that links to the concerts listing page", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-back")).toBeInTheDocument();
				});

				// Back link should point to /concerts
				const backLink = screen.getByTestId("concert-detail-back");
				expect(backLink.closest("a")).toHaveAttribute("href", "/concerts");
			});
		});
	});
});
