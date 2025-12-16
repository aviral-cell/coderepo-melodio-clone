// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

import { SearchDropdown } from "@/shared/components/common/SearchDropdown";

jest.mock("@/shared/utils", () => ({
	formatDuration: (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	},
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
	normalizeTracks: (tracks: unknown[]) => tracks.map((track: Record<string, unknown>) => ({
		_id: track.id,
		title: track.title,
		durationInSeconds: track.durationInSeconds,
		trackNumber: track.trackNumber,
		genre: track.genre,
		playCount: track.playCount,
		createdAt: track.createdAt,
		updatedAt: track.updatedAt,
		coverImageUrl: track.coverImageUrl,
		artistId: track.artist,
		albumId: track.album,
	})),
}));

interface BackendTrackResponse {
	id: string;
	title: string;
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	createdAt: string;
	updatedAt: string;
	coverImageUrl?: string;
	artist: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	album: {
		id: string;
		title: string;
		coverImageUrl?: string;
	};
}

function createMockTrack(
	id: string,
	title: string,
	artistName = "Test Artist",
	albumTitle = "Test Album"
): BackendTrackResponse {
	return {
		id,
		title,
		durationInSeconds: 180,
		trackNumber: 1,
		genre: "rock",
		playCount: 1000,
		createdAt: "2023-01-01T00:00:00Z",
		updatedAt: "2023-01-01T00:00:00Z",
		coverImageUrl: `https://hackerrank.com/track-${id}.jpg`,
		artist: {
			id: `artist-${id}`,
			name: artistName,
			imageUrl: `https://hackerrank.com/artist-${id}.jpg`,
		},
		album: {
			id: `album-${id}`,
			title: albumTitle,
			coverImageUrl: `https://hackerrank.com/album-${id}.jpg`,
		},
	};
}

function createApiResponse<T>(data: T) {
	return {
		success: true,
		data,
	};
}

function LocationDisplay() {
	const location = useLocation();
	return <div data-testid="location-display">{location.pathname}</div>;
}

function TestWrapper({
	children,
	initialRoute = "/",
}: {
	children: React.ReactNode;
	initialRoute?: string;
}) {
	return (
		<MemoryRouter initialEntries={[initialRoute]}>
			{children}
			<LocationDisplay />
		</MemoryRouter>
	);
}

function renderSearchDropdown(props: {
	query: string;
	isOpen: boolean;
	onClose?: jest.Mock;
}) {
	const onClose = props.onClose || jest.fn();
	return render(
		<TestWrapper>
			<SearchDropdown
				query={props.query}
				isOpen={props.isOpen}
				onClose={onClose}
			/>
			<Routes>
				<Route path="/track/:id" element={<div data-testid="track-detail-page">Track Detail</div>} />
			</Routes>
		</TestWrapper>
	);
}

const DEBOUNCE_DELAY = 300;

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

describe("Search Feature - Behavior Tests", () => {
	beforeAll(() => {
		delete (window as { location?: Location }).location;
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
		jest.useFakeTimers();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	function setupSearchFetch(tracks: BackendTrackResponse[]) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/tracks/search")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse(tracks)),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse([])),
			});
		});
	}

	function setupSearchFetchError(errorMessage: string) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/tracks/search")) {
				return Promise.resolve({
					ok: false,
					status: 500,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve({ success: false, error: errorMessage }),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse([])),
			});
		});
	}

	function setupSearchFetchPending() {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/tracks/search")) {
				return new Promise(() => {});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse([])),
			});
		});
	}

	describe("Dropdown Visibility", () => {
		it("should not render when isOpen is false", () => {
			setupSearchFetch([]);

			render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={false} onClose={jest.fn()} />
				</TestWrapper>
			);

			expect(screen.queryByTestId("search-dropdown")).not.toBeInTheDocument();
		});

		it("should render when isOpen is true", async () => {
			setupSearchFetch([]);

			render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument();
		});
	});

	describe("Empty Query Behavior", () => {
		it("should show no results and skip API call for empty or whitespace-only query", async () => {
			setupSearchFetch([]);

			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify no results shown
			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
			expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");

			// Verify no API call
			let searchCalls = mockFetch.mock.calls.filter(
				(call) => call[0].includes("/api/tracks/search")
			);
			expect(searchCalls.length).toBe(0);

			// Test whitespace query
			rerender(
				<TestWrapper>
					<SearchDropdown query="   " isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();

			searchCalls = mockFetch.mock.calls.filter(
				(call) => call[0].includes("/api/tracks/search")
			);
			expect(searchCalls.length).toBe(0);
		});
	});

	describe("API Request Behavior", () => {
		it("should make GET request to /api/tracks/search with query parameter", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			render(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify API request
			await waitFor(() => {
				const searchCalls = mockFetch.mock.calls.filter(
					(call) => call[0].includes("/api/tracks/search")
				);
				expect(searchCalls.length).toBeGreaterThan(0);
				expect(searchCalls[0][0]).toContain("q=Thunder");
			});
		});

		it("should include authorization header in API request", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			render(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify authorization header
			await waitFor(() => {
				const searchCalls = mockFetch.mock.calls.filter(
					(call) => call[0].includes("/api/tracks/search")
				);
				expect(searchCalls.length).toBeGreaterThan(0);
				const headers = searchCalls[0][1].headers;
				expect(headers.get("Authorization")).toContain("Bearer");
			});
		});
	});

	describe("Debounce Behavior", () => {
		it("should not make API call before debounce delay completes when query changes", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			mockFetch.mockClear();

			// Change query
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			// Advance less than debounce delay
			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY - 50);
			});

			// Verify no API call yet
			const searchCalls = mockFetch.mock.calls.filter(
				(call) => call[0].includes("/api/tracks/search")
			);
			expect(searchCalls.length).toBe(0);
		});

		it("should make API call after debounce delay (300ms) when query changes", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			mockFetch.mockClear();

			// Change query
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			// Verify no call yet
			await waitFor(() => {
				const searchCalls = mockFetch.mock.calls.filter(
					(call) => call[0].includes("/api/tracks/search")
				);
				expect(searchCalls.length).toBe(0);
			});

			// Complete debounce delay
			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify API call made
			await waitFor(() => {
				const searchCalls = mockFetch.mock.calls.filter(
					(call) => call[0].includes("/api/tracks/search")
				);
				expect(searchCalls.length).toBeGreaterThan(0);
			});
		});

		it("should debounce rapid query changes and only make one API call with final query", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			mockFetch.mockClear();

			const getSearchCalls = () =>
				mockFetch.mock.calls.filter((call) => call[0].includes("/api/tracks/search"));

			// Type "T"
			rerender(
				<TestWrapper>
					<SearchDropdown query="T" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);
			await act(async () => {
				jest.advanceTimersByTime(100);
			});
			expect(getSearchCalls().length).toBe(0);

			// Type "Th"
			rerender(
				<TestWrapper>
					<SearchDropdown query="Th" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);
			await act(async () => {
				jest.advanceTimersByTime(100);
			});
			expect(getSearchCalls().length).toBe(0);

			// Type "Thu"
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thu" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);
			await act(async () => {
				jest.advanceTimersByTime(100);
			});
			expect(getSearchCalls().length).toBe(0);

			// Type "Thun"
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thun" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);
			await act(async () => {
				jest.advanceTimersByTime(100);
			});
			expect(getSearchCalls().length).toBe(0);

			// Type "Thunder" (final)
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(100);
			});
			expect(getSearchCalls().length).toBe(0);

			// Complete debounce
			await act(async () => {
				jest.advanceTimersByTime(200);
			});

			// Verify single API call with final query
			await waitFor(() => {
				const searchCalls = getSearchCalls();
				expect(searchCalls.length).toBe(1);
				expect(searchCalls[0][0]).toContain("q=Thunder");
			});
		});
	});

	describe("Results Display", () => {
		it("should display correct results count (singular/plural) based on number of tracks", async () => {
			const mockTracks = [
				createMockTrack("track-1", "Thunder", "Imagine Dragons", "Evolve"),
				createMockTrack("track-2", "Lightning", "Eric Clapton", "Slowhand"),
			];
			setupSearchFetch(mockTracks);

			const { unmount } = render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-results-list")).toBeInTheDocument();
			});

			// Verify plural
			expect(screen.getByTestId("search-results-count")).toHaveTextContent("2 RESULTS");
			unmount();

			// Test singular
			setupSearchFetch([createMockTrack("track-1", "Thunder")]);

			render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-results-count")).toHaveTextContent("1 RESULT");
			});
		});

		it("should display complete track information (title, artist, album, duration)", async () => {
			const mockTracks = [
				createMockTrack("track-1", "Thunder", "Imagine Dragons", "Evolve"),
				createMockTrack("track-2", "Lightning", "Eric Clapton", "Slowhand"),
			];
			setupSearchFetch(mockTracks);

			render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify track information
			await waitFor(() => {
				expect(screen.getByTestId("search-result-title-track-1")).toHaveTextContent("Thunder");
				expect(screen.getByTestId("search-result-title-track-2")).toHaveTextContent("Lightning");
				expect(screen.getByTestId("search-result-artist-track-1")).toHaveTextContent(
					"Imagine Dragons - Evolve"
				);
				expect(screen.getByTestId("search-result-artist-track-2")).toHaveTextContent(
					"Eric Clapton - Slowhand"
				);
				expect(screen.getByTestId("search-result-duration-track-1")).toHaveTextContent("3:00");
				expect(screen.getByTestId("search-result-duration-track-2")).toHaveTextContent("3:00");
			});
		});
	});

	describe("No Results State", () => {
		it("should display 'No results found' when API returns empty array", async () => {
			setupSearchFetch([]);

			render(
				<TestWrapper>
					<SearchDropdown query="nonexistenttrack" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify no results message
			await waitFor(() => {
				expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
				expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");
			});
		});
	});

	describe("Error State", () => {
		it("should display error message when API fails or throws", async () => {
			setupSearchFetchError("Network error");

			const { unmount } = render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify error state (API returns error)
			await waitFor(() => {
				expect(screen.getByTestId("search-error")).toBeInTheDocument();
			});

			unmount();

			// Test network failure
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/tracks/search")) {
					return Promise.reject(new Error("Network failure"));
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse([])),
				});
			});

			render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			// Verify error state (network failure)
			await waitFor(() => {
				expect(screen.getByTestId("search-error")).toBeInTheDocument();
			});
		});
	});

	describe("Track Selection Navigation", () => {
		it("should navigate to track detail page and close dropdown when track is clicked", async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			const onClose = jest.fn();
			const mockTracks = [
				createMockTrack("abc-123", "First Track"),
				createMockTrack("xyz-789", "Second Track"),
			];
			setupSearchFetch(mockTracks);

			renderSearchDropdown({
				query: "track",
				isOpen: true,
				onClose,
			});

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-item-xyz-789")).toBeInTheDocument();
			});

			// Click track
			await user.click(screen.getByTestId("search-result-item-xyz-789"));

			// Verify navigation
			await waitFor(() => {
				expect(screen.getByTestId("location-display")).toHaveTextContent("/track/xyz-789");
			});

			// Verify dropdown closed
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});
});
