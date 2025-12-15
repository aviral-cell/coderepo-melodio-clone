/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Search Feature Behavior Tests
 * SCENARIO: Testing search with debouncing, loading states, results display, navigation, and error handling
 * EXPECTATION: Component makes correct HTTP requests and displays correct UI states
 *
 * NOTE: Tests mock at the fetch (HTTP) level, not at service/hook level.
 * This allows candidates to implement services/hooks however they prefer.
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

import { SearchDropdown } from "@/shared/components/common/SearchDropdown";

// Mock formatDuration utility for consistent test output
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

/**
 * Backend API Track Response format (what the API returns)
 */
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

/**
 * Factory function to create mock tracks in BACKEND API format
 */
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

/**
 * Create a successful API response wrapper
 */
function createApiResponse<T>(data: T) {
	return {
		success: true,
		data,
	};
}

/**
 * Helper component to capture current location for navigation testing
 */
function LocationDisplay() {
	const location = useLocation();
	return <div data-testid="location-display">{location.pathname}</div>;
}

/**
 * Test wrapper with Router for navigation testing
 */
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

/**
 * Render SearchDropdown with routing context
 */
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

// Store original fetch and location
const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

describe("Search Feature - Behavior Tests", () => {
	beforeAll(() => {
		// Setup proper window.location for JSDOM so apiService can construct URLs
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

	/**
	 * Helper to setup fetch mock for search API
	 */
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

	/**
	 * Helper to setup fetch mock that returns an error
	 */
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

	/**
	 * Helper to setup fetch mock that never resolves (for loading state testing)
	 */
	function setupSearchFetchPending() {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/tracks/search")) {
				return new Promise(() => {}); // Never resolves
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

			// Test empty string query
			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
			expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");

			// Verify no API call for empty query
			let searchCalls = mockFetch.mock.calls.filter(
				(call) => call[0].includes("/api/tracks/search")
			);
			expect(searchCalls.length).toBe(0);

			// Test whitespace-only query
			rerender(
				<TestWrapper>
					<SearchDropdown query="   " isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();

			// Verify no API call for whitespace query
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

			await waitFor(() => {
				const searchCalls = mockFetch.mock.calls.filter(
					(call) => call[0].includes("/api/tracks/search")
				);
				expect(searchCalls.length).toBeGreaterThan(0);
				// apiService passes headers as a Headers object
				const headers = searchCalls[0][1].headers;
				expect(headers.get("Authorization")).toContain("Bearer");
			});
		});
	});

	describe("Debounce Behavior", () => {
		it("should not make API call before debounce delay completes when query changes", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			// Start with empty query (no API call)
			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			// Clear any initial calls
			mockFetch.mockClear();

			// Change query - this starts the debounce timer
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			// Advance timer but not enough for debounce to complete
			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY - 50);
			});

			// API should NOT have been called yet
			const searchCalls = mockFetch.mock.calls.filter(
				(call) => call[0].includes("/api/tracks/search")
			);
			expect(searchCalls.length).toBe(0);
		});

		it("should make API call after debounce delay (300ms) when query changes", async () => {
			setupSearchFetch([createMockTrack("1", "Thunder")]);

			// Start with empty query (no API call)
			const { rerender } = render(
				<TestWrapper>
					<SearchDropdown query="" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			// Clear any initial calls
			mockFetch.mockClear();

			// Change query - this starts the debounce timer
			rerender(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			// Advance timer to complete debounce
			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				const searchCalls = mockFetch.mock.calls.filter(
					(call) => call[0].includes("/api/tracks/search")
				);
				expect(searchCalls.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Loading State", () => {
		it("should show loading indicator while waiting for API response", async () => {
			setupSearchFetchPending();

			render(
				<TestWrapper>
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-loading")).toBeInTheDocument();
			});
		});

		it("should hide loading indicator after API response is received", async () => {
			let resolvePromise: (value: unknown) => void;
			const pendingPromise = new Promise((resolve) => {
				resolvePromise = resolve;
			});

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/tracks/search")) {
					return pendingPromise;
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
					<SearchDropdown query="Thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-loading")).toBeInTheDocument();
			});

			await act(async () => {
				resolvePromise!({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse([createMockTrack("1", "Thunder")])),
				});
			});

			await waitFor(() => {
				expect(screen.queryByTestId("search-loading")).not.toBeInTheDocument();
			});
		});
	});

	describe("Results Display", () => {
		it("should display correct results count (singular/plural) based on number of tracks", async () => {
			// Test multiple results (plural)
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

			expect(screen.getByTestId("search-results-count")).toHaveTextContent("2 RESULTS");
			unmount();

			// Test single result (singular)
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

			await waitFor(() => {
				// Verify track titles
				expect(screen.getByTestId("search-result-title-track-1")).toHaveTextContent("Thunder");
				expect(screen.getByTestId("search-result-title-track-2")).toHaveTextContent("Lightning");
				// Verify artist and album info
				expect(screen.getByTestId("search-result-artist-track-1")).toHaveTextContent(
					"Imagine Dragons - Evolve"
				);
				expect(screen.getByTestId("search-result-artist-track-2")).toHaveTextContent(
					"Eric Clapton - Slowhand"
				);
				// Verify duration (180 seconds = 3:00)
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

			await waitFor(() => {
				expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
				expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");
			});
		});
	});

	describe("Error State", () => {
		it("should display error message when API fails or throws", async () => {
			// Test API returning error response
			setupSearchFetchError("Network error");

			const { unmount } = render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-error")).toBeInTheDocument();
			});

			unmount();

			// Test fetch throwing an error
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

			// Click the second track
			await user.click(screen.getByTestId("search-result-item-xyz-789"));

			// Verify navigation to correct track page
			await waitFor(() => {
				expect(screen.getByTestId("location-display")).toHaveTextContent("/track/xyz-789");
			});

			// Verify onClose was called
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("Search Result Item Accessibility", () => {
		it("should render search results as clickable buttons", async () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];
			setupSearchFetch(mockTracks);

			render(
				<TestWrapper>
					<SearchDropdown query="thunder" isOpen={true} onClose={jest.fn()} />
				</TestWrapper>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				const resultItem = screen.getByTestId("search-result-item-track-1");
				expect(resultItem.tagName).toBe("BUTTON");
				expect(resultItem).toHaveAttribute("type", "button");
			});
		});
	});
});
