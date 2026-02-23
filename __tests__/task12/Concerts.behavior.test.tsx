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
			it("should display upcoming concerts sorted descending by date with furthest future first", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

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
			it("should filter concerts to March only when March is selected", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-3"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(2);
				});

				expect(screen.getByTestId("concerts-card-c1")).toBeInTheDocument();
				expect(screen.getByTestId("concerts-card-c3")).toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-card-c4")).not.toBeInTheDocument();
			});

			it("should filter concerts to April only when April is selected", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-4"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(1);
				});

				expect(screen.getByTestId("concerts-card-c2")).toBeInTheDocument();
			});

			it("should show no concerts when November is selected (no events in November)", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-11"));

				await waitFor(() => {
					expect(screen.queryAllByTestId(/^concerts-card-c\d$/)).toHaveLength(0);
				});

				expect(screen.getByText("No concerts found for this month.")).toBeInTheDocument();
			});

			it("should filter concerts to October showing only c4", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-10"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(1);
				});

				expect(screen.getByTestId("concerts-card-c4")).toBeInTheDocument();
			});

			it("should filter concerts to December showing only c6", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-12"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(1);
				});

				expect(screen.getByTestId("concerts-card-c6")).toBeInTheDocument();
			});

			it("should filter concerts to May showing only c5", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-5"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(1);
				});

				expect(screen.getByTestId("concerts-card-c5")).toBeInTheDocument();
			});

			it("should have an 'All' option (value 0) in the month dropdown", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));

				await waitFor(() => {
					expect(screen.getByTestId("concerts-month-option-0")).toBeInTheDocument();
				});
			});

			it("should show all upcoming concerts when 'All' is selected after filtering by month", async () => {
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

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-3"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(2);
				});

				await user.click(screen.getByTestId("concerts-month-filter"));
				await user.click(screen.getByTestId("concerts-month-option-0"));

				await waitFor(() => {
					const concertCards = screen.getAllByTestId(/^concerts-card-c\d$/);
					expect(concertCards).toHaveLength(6);
				});
			});
		});

		describe("City Filter", () => {
			it("should show only New York artists when New York chip is clicked", async () => {
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

				await user.click(screen.getByTestId("concerts-city-chip-new-york"));

				await waitFor(() => {
					expect(screen.getByTestId("concerts-artist-a1")).toBeInTheDocument();
					expect(screen.getByTestId("concerts-artist-a4")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("concerts-artist-a2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-artist-a3")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-artist-a5")).not.toBeInTheDocument();
			});

			it("should show only Los Angeles artists when Los Angeles chip is clicked", async () => {
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

				await user.click(screen.getByTestId("concerts-city-chip-los-angeles"));

				await waitFor(() => {
					expect(screen.getByTestId("concerts-artist-a3")).toBeInTheDocument();
					expect(screen.getByTestId("concerts-artist-a5")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("concerts-artist-a1")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-artist-a2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concerts-artist-a4")).not.toBeInTheDocument();
			});
		});

		describe("Date Badge Format", () => {
			it("should display month abbreviation first and day number second for c1 (Mar 15)", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-date-c1")).toBeInTheDocument();
				});

				const badge = screen.getByTestId("concerts-card-date-c1");
				expect(badge.children[0]).toHaveTextContent("Mar");
				expect(badge.children[1]).toHaveTextContent("15");
			});

			it("should display month abbreviation first and day number second for c6 (Dec 12)", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-date-c6")).toBeInTheDocument();
				});

				const badge = screen.getByTestId("concerts-card-date-c6");
				expect(badge.children[0]).toHaveTextContent("Dec");
				expect(badge.children[1]).toHaveTextContent("12");
			});
		});

		describe("Time Format", () => {
			it("should display c1 time '19:30' as '7:30 PM' in 12-hour format", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-time-c1")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concerts-card-time-c1")).toHaveTextContent("7:30 PM");
			});

			it("should display c4 time '18:00' as '6:00 PM' in 12-hour format", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-time-c4")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concerts-card-time-c4")).toHaveTextContent("6:00 PM");
			});

			it("should display c5 time '20:00' as '8:00 PM' in 12-hour format", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-card-time-c5")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concerts-card-time-c5")).toHaveTextContent("8:00 PM");
			});
		});

		describe("Past Concert Filtering", () => {
			it("should not display past concerts in the upcoming listing", async () => {
				setupListingMocks();

				render(
					<ListingWrapper>
						<ConcertsPage />
					</ListingWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concerts-upcoming")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("concerts-card-c7")).not.toBeInTheDocument();
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

		describe("Detail Display", () => {
			it("should display the concert date in 'Mon Day' format (Mar 15)", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-date")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concert-detail-date")).toHaveTextContent("Mar 15");
			});

			it("should display the concert time in 12-hour format (7:30 PM)", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-time")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("7:30 PM");
			});

			it("should format midnight '00:00' as '12:00 AM'", async () => {
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

				render(
					<DetailWrapper concertId="c-midnight">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-time")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("12:00 AM");
			});

			it("should format noon '12:00' as '12:00 PM'", async () => {
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

				render(
					<DetailWrapper concertId="c-noon">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-time")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concert-detail-time")).toHaveTextContent("12:00 PM");
			});
		});

		describe("Artist Albums", () => {
			it("should show exactly 1 album for artist a1 (The Amplifiers)", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-albums")).toBeInTheDocument();
				});

				const albumItems = screen.getAllByTestId(/^concert-detail-album-/);
				expect(albumItems).toHaveLength(1);
				expect(screen.getByTestId("concert-detail-album-alb1")).toBeInTheDocument();
			});

			it("should not show albums from other artists (alb2, alb3)", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-albums")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("concert-detail-album-alb2")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concert-detail-album-alb3")).not.toBeInTheDocument();
			});
		});

		describe("Artist Tracks", () => {
			it("should show exactly 2 tracks for artist a1 (The Amplifiers)", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-tracks")).toBeInTheDocument();
				});

				const trackItems = screen.getAllByTestId(/^concert-detail-track-/);
				expect(trackItems).toHaveLength(2);
			});

			it("should not show tracks from other artists (t3, t4)", async () => {
				setupDetailMocks();

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-tracks")).toBeInTheDocument();
				});

				expect(screen.queryByTestId("concert-detail-track-t3")).not.toBeInTheDocument();
				expect(screen.queryByTestId("concert-detail-track-t4")).not.toBeInTheDocument();
			});
		});

		describe("Buy Ticket Dialog", () => {
			it("should open buy ticket dialog when buy button is clicked", async () => {
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

				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-dialog")).toBeInTheDocument();
				});
			});

			it("should show available tickets remaining when dialog opens", async () => {
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

				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-available")).toHaveTextContent(/Available: 6 tickets remaining/i);
				});
			});

			it("should increment ticket quantity when plus button is clicked", async () => {
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

				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("1");
				});

				await user.click(screen.getByTestId("concert-buy-increment"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("2");
				});
			});

			it("should disable decrement button when quantity is at minimum (1)", async () => {
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

				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-decrement")).toBeDisabled();
				});
			});
		});

		describe("Ticket Purchase", () => {
			it("should update ticket count to 1/6 after purchasing a single ticket", async () => {
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

				expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("0/6 tickets");

				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-dialog")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("concert-buy-confirm"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("1/6 tickets");
				});
			});

			it("should update ticket count to 2/6 after purchasing 2 tickets", async () => {
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

				await user.click(screen.getByTestId("concert-detail-buy-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-dialog")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("concert-buy-increment"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-buy-quantity")).toHaveTextContent("2");
				});

				await user.click(screen.getByTestId("concert-buy-confirm"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("2/6 tickets");
				});
			});
		});

		describe("Ticket Limits", () => {
			it("should hide buy button and show 6/6 when user has reached ticket limit", async () => {
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

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("6/6 tickets");
				});

				expect(screen.queryByTestId("concert-detail-buy-btn")).not.toBeInTheDocument();
			});

			it("should show 3/6 tickets and keep buy button visible when user has 3 tickets", async () => {
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

				render(
					<DetailWrapper concertId="c1">
						<ConcertDetailPage />
					</DetailWrapper>,
				);

				await waitFor(() => {
					expect(screen.getByTestId("concert-detail-ticket-count")).toHaveTextContent("3/6 tickets");
				});

				expect(screen.getByTestId("concert-detail-buy-btn")).toBeInTheDocument();
			});
		});

		describe("View Tickets Dialog", () => {
			it("should open view tickets dialog when view tickets button is clicked", async () => {
				const ticketsData = [
					{
						userId: "user-1",
						quantity: 2,
						ticketCodes: ["CONC-00c1-abc123", "CONC-00c1-def456"],
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

				await user.click(screen.getByTestId("concert-detail-view-tickets-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-tickets-dialog")).toBeInTheDocument();
				});
			});

			it("should display ticket cards with correct ticket codes", async () => {
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

				await user.click(screen.getByTestId("concert-detail-view-tickets-btn"));

				await waitFor(() => {
					expect(screen.getByTestId("concert-tickets-dialog")).toBeInTheDocument();
				});

				expect(screen.getByTestId("concert-ticket-CONC-00c1-abc123")).toBeInTheDocument();
				expect(screen.getByTestId("concert-ticket-CONC-00c1-def456")).toBeInTheDocument();
				expect(screen.getByTestId("concert-ticket-CONC-00c1-ghi789")).toBeInTheDocument();
			});
		});
	});
});
