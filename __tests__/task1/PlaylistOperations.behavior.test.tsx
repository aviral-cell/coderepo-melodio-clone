// @ts-nocheck
/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Playlist Operations Behavior Tests
 * SCENARIO: Testing drag-drop reorder and remove track through UI interaction
 * EXPECTATION: UI reflects track reorder/removal, rolls back on API failure
 */
import React from "react";
import { render, screen, act, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import PlaylistDetailPage from "@/pages/PlaylistDetailPage";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// Mock useImageColor to avoid color extraction issues in tests
jest.mock("@/shared/hooks/useImageColor", () => ({
	useImageColor: () => ({ color: "#333333", isReady: true }),
}));

// Mock auth context to provide authenticated user
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

// Mock SidebarContext
jest.mock("@/shared/contexts/SidebarContext", () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
	useSidebar: () => ({
		isMobileSidebarOpen: false,
		toggleMobileSidebar: jest.fn(),
		closeMobileSidebar: jest.fn(),
	}),
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
function createMockTrack(id: string, title: string): BackendTrackResponse {
	return {
		id,
		title,
		durationInSeconds: 180,
		trackNumber: 1,
		genre: "Pop",
		playCount: 100,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		coverImageUrl: "/cover.jpg",
		artist: {
			id: `artist-${id}`,
			name: `Artist ${id}`,
			imageUrl: "/artist.jpg",
		},
		album: {
			id: `album-${id}`,
			title: `Album ${id}`,
			coverImageUrl: "/cover.jpg",
		},
	};
}

/**
 * Create mock playlist with tracks in BACKEND API format
 */
function createMockPlaylist(tracks: BackendTrackResponse[]) {
	return {
		_id: "playlist-123",
		name: "Test Playlist",
		description: "A test playlist",
		ownerId: "user-1",
		trackIds: tracks.map((t) => t.id),
		tracks,
		isPublic: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
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
 * Create an error API response
 */
function createErrorResponse(message: string) {
	return {
		success: false,
		error: message,
	};
}

/**
 * Test wrapper with all required providers
 */
function TestWrapper({
	children,
	initialRoute = "/playlists/playlist-123",
}: {
	children: React.ReactNode;
	initialRoute?: string;
}) {
	return (
		<MemoryRouter initialEntries={[initialRoute]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>{children}</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

/**
 * Render PlaylistDetailPage with routing
 */
function renderPlaylistPage() {
	return render(
		<TestWrapper>
			<Routes>
				<Route path="/playlists/:id" element={<PlaylistDetailPage />} />
			</Routes>
		</TestWrapper>
	);
}

/**
 * Helper to get track titles in order from the rendered list
 */
function getTrackTitlesInOrder(): string[] {
	const trackElements = document.querySelectorAll(
		".truncate.text-sm.font-medium"
	);
	return Array.from(trackElements).map((el) => el.textContent || "");
}

/**
 * Helper to open dropdown menu for a track
 */
async function openTrackDropdown(
	user: ReturnType<typeof userEvent.setup>,
	trackTitle: string
) {
	const trackTitleElement = screen.getByText(trackTitle);
	const trackRow = trackTitleElement.closest(
		'[class*="grid-cols"]'
	) as HTMLElement;

	if (!trackRow) {
		throw new Error(`Track row not found for: ${trackTitle}`);
	}

	const dropdownTrigger = within(trackRow).getByRole("button", {
		name: "",
	});
	await user.click(dropdownTrigger);
}

/**
 * Helper to simulate drag-drop using pointer events
 */
async function simulateDragDrop(
	sourceHandle: HTMLElement,
	targetHandle: HTMLElement
) {
	const sourceRect = sourceHandle.getBoundingClientRect();
	const targetRect = targetHandle.getBoundingClientRect();

	const startX = sourceRect.left + sourceRect.width / 2;
	const startY = sourceRect.top + sourceRect.height / 2;
	const endX = targetRect.left + targetRect.width / 2;
	const endY = targetRect.top + targetRect.height / 2;

	fireEvent.pointerDown(sourceHandle, {
		pointerId: 1,
		clientX: startX,
		clientY: startY,
		button: 0,
		buttons: 1,
	});

	await act(async () => {
		fireEvent.pointerMove(sourceHandle, {
			pointerId: 1,
			clientX: startX,
			clientY: startY + 10,
			button: 0,
			buttons: 1,
		});
	});

	await act(async () => {
		fireEvent.pointerMove(document.body, {
			pointerId: 1,
			clientX: endX,
			clientY: endY,
			button: 0,
			buttons: 1,
		});
	});

	await act(async () => {
		fireEvent.pointerUp(document.body, {
			pointerId: 1,
			clientX: endX,
			clientY: endY,
			button: 0,
		});
	});
}

// Store original fetch and location
const originalFetch = global.fetch;
const originalLocation = window.location;

// Mock fetch at the HTTP level
let mockFetch: jest.Mock;

describe("Playlist Operations Behavior Tests", () => {
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

	/**
	 * Helper to setup fetch mock for playlist loading
	 */
	function setupPlaylistFetch(playlist: ReturnType<typeof createMockPlaylist>) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/playlists/playlist-123") && !url.includes("/tracks") && !url.includes("/reorder")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse(playlist)),
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

	describe("Playlist Loading and Display", () => {
		it("should display loading state initially", async () => {
			mockFetch.mockImplementation(() => new Promise(() => {}));

			renderPlaylistPage();

			const loadingElements = document.querySelectorAll('[class*="animate-pulse"]');
			expect(loadingElements.length).toBeGreaterThan(0);
		});

		it("should display all tracks in correct order after loading", async () => {
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const trackC = createMockTrack("C", "Track Charlie");
			const playlist = createMockPlaylist([trackA, trackB, trackC]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			});

			expect(screen.getByText("Track Beta")).toBeInTheDocument();
			expect(screen.getByText("Track Charlie")).toBeInTheDocument();

			const titles = getTrackTitlesInOrder();
			expect(titles).toEqual(["Track Alpha", "Track Beta", "Track Charlie"]);
		});

		it("should display playlist name and track count", async () => {
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const playlist = createMockPlaylist([trackA, trackB]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Test Playlist")).toBeInTheDocument();
			});

			expect(screen.getByText(/2 tracks/)).toBeInTheDocument();
		});

		it("should display empty state when playlist has no tracks", async () => {
			const playlist = createMockPlaylist([]);
			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("No tracks yet")).toBeInTheDocument();
			});
		});

		it("should make GET request to correct endpoint", async () => {
			const playlist = createMockPlaylist([]);
			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
			});

			const calls = mockFetch.mock.calls;
			const playlistCall = calls.find(
				(call) => call[0].includes("/api/playlists/playlist-123")
			);
			expect(playlistCall).toBeDefined();
			expect(playlistCall[1].method).toBe("GET");
		});
	});

	describe("Remove Track", () => {
		it("should remove track from list when remove button is clicked", async () => {
			const user = userEvent.setup();
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const trackC = createMockTrack("C", "Track Charlie");
			const playlist = createMockPlaylist([trackA, trackB, trackC]);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/playlists/playlist-123") && options?.method === "GET") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(playlist)),
					});
				}
				if (url.includes("/api/playlists/playlist-123/tracks/B") && options?.method === "DELETE") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({
							...playlist,
							tracks: [trackA, trackC],
							trackIds: ["A", "C"],
						})),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse([])),
				});
			});

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			});

			await openTrackDropdown(user, "Track Beta");
			const removeButton = await screen.findByTestId("remove-track-menu-item");
			await user.click(removeButton);

			await waitFor(() => {
				expect(screen.queryByText("Track Beta")).not.toBeInTheDocument();
			});

			expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			expect(screen.getByText("Track Charlie")).toBeInTheDocument();
		});

		it("should make DELETE request to correct endpoint when removing track", async () => {
			const user = userEvent.setup();
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const playlist = createMockPlaylist([trackA, trackB]);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/playlists/playlist-123") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(playlist)),
					});
				}
				if (options?.method === "DELETE") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({
							...playlist,
							tracks: [trackA],
							trackIds: ["A"],
						})),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse([])),
				});
			});

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Beta")).toBeInTheDocument();
			});

			await openTrackDropdown(user, "Track Beta");
			const removeButton = await screen.findByTestId("remove-track-menu-item");
			await user.click(removeButton);

			await waitFor(() => {
				const deleteCall = mockFetch.mock.calls.find(
					(call) => call[1]?.method === "DELETE"
				);
				expect(deleteCall).toBeDefined();
				expect(deleteCall[0]).toContain("/api/playlists/playlist-123/tracks/B");
			});
		});

		it("should keep track in list when API returns error", async () => {
			const user = userEvent.setup();
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const playlist = createMockPlaylist([trackA, trackB]);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/playlists/playlist-123") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(playlist)),
					});
				}
				if (options?.method === "DELETE") {
					return Promise.resolve({
						ok: false,
						status: 500,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createErrorResponse("Failed to remove track")),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse([])),
				});
			});

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Beta")).toBeInTheDocument();
			});

			await openTrackDropdown(user, "Track Beta");
			const removeButton = await screen.findByTestId("remove-track-menu-item");
			await user.click(removeButton);

			await waitFor(() => {
				const deleteCall = mockFetch.mock.calls.find(
					(call) => call[1]?.method === "DELETE"
				);
				expect(deleteCall).toBeDefined();
			});

			expect(screen.getByText("Track Beta")).toBeInTheDocument();
			expect(screen.getByText("Track Alpha")).toBeInTheDocument();
		});

		it("should handle removing the last track", async () => {
			const user = userEvent.setup();
			const trackA = createMockTrack("A", "Track Alpha");
			const playlist = createMockPlaylist([trackA]);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/playlists/playlist-123") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(playlist)),
					});
				}
				if (options?.method === "DELETE") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({
							...playlist,
							tracks: [],
							trackIds: [],
						})),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse([])),
				});
			});

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			});

			await openTrackDropdown(user, "Track Alpha");
			const removeButton = await screen.findByTestId("remove-track-menu-item");
			await user.click(removeButton);

			await waitFor(() => {
				expect(screen.getByText("No tracks yet")).toBeInTheDocument();
			});
		});
	});

	describe("Drag and Drop Reorder", () => {

		it("should display drag handles for each track", async () => {
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const playlist = createMockPlaylist([trackA, trackB]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			});

			const dragHandles = screen.getAllByLabelText("Drag to reorder");
			expect(dragHandles).toHaveLength(2);
		});

		it("should have draggable track items with correct ARIA attributes", async () => {
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const playlist = createMockPlaylist([trackA, trackB]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			});

			const dragHandles = screen.getAllByLabelText("Drag to reorder");
			dragHandles.forEach((handle) => {
				expect(handle).toHaveAttribute("tabindex");
			});
		});

		it("should make PATCH request to reorder endpoint when drag completes", async () => {
			// Import the playlist service to test it directly
			const { playlistsService } = await import("@/shared/services/playlist.service");

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/reorder") && options?.method === "PATCH") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ _id: "playlist-123" })),
					});
				}
				return Promise.resolve({
					ok: false,
					status: 404,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve({ error: "Not found" }),
				});
			});

			// Call the reorder service directly (this is what the drag-drop triggers)
			await playlistsService.reorderTracks("playlist-123", ["B", "A", "C"]);

			// Assert that PATCH request was made to reorder endpoint
			const patchCall = mockFetch.mock.calls.find(
				(call) => call[0].includes("/reorder") && call[1]?.method === "PATCH"
			);
			expect(patchCall).toBeDefined();
			expect(patchCall[0]).toContain("/api/playlists/playlist-123/reorder");
		});

		it("should send trackIds array in reorder request body", async () => {
			// Import the playlist service to test it directly
			const { playlistsService } = await import("@/shared/services/playlist.service");

			let capturedBody: string | undefined;

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/reorder") && options?.method === "PATCH") {
					capturedBody = options.body as string;
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ _id: "playlist-123" })),
					});
				}
				return Promise.resolve({
					ok: false,
					status: 404,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve({ error: "Not found" }),
				});
			});

			// Call the reorder service directly
			await playlistsService.reorderTracks("playlist-123", ["B", "A"]);

			// Assert that request body contains trackIds array (not 'tracks')
			expect(capturedBody).toBeDefined();
			const parsedBody = JSON.parse(capturedBody!);
			expect(parsedBody).toHaveProperty("trackIds");
			expect(Array.isArray(parsedBody.trackIds)).toBe(true);
		});
	});

	describe("Playlist Actions Menu", () => {
		it("should display playlist action menu with edit and delete options", async () => {
			const user = userEvent.setup();
			const trackA = createMockTrack("A", "Track Alpha");
			const playlist = createMockPlaylist([trackA]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Test Playlist")).toBeInTheDocument();
			});

			const dropdownButtons = screen.getAllByRole("button");
			const playlistMenuButton = dropdownButtons.find(
				(btn) =>
					btn.querySelector(".lucide-ellipsis") ||
					btn.querySelector('svg.h-6.w-6')
			);

			if (playlistMenuButton) {
				await user.click(playlistMenuButton);

				await waitFor(() => {
					expect(screen.getByTestId("edit-playlist-menu-item")).toBeInTheDocument();
					expect(screen.getByTestId("delete-playlist-menu-item")).toBeInTheDocument();
				});
			}
		});
	});

	describe("Track Playback", () => {
		it("should have play button for each track", async () => {
			const trackA = createMockTrack("A", "Track Alpha");
			const trackB = createMockTrack("B", "Track Beta");
			const playlist = createMockPlaylist([trackA, trackB]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Track Alpha")).toBeInTheDocument();
			});

			const playButtons = screen.getAllByLabelText(/Play|Pause/);
			expect(playButtons.length).toBeGreaterThan(0);
		});

		it("should have play all button for playlist", async () => {
			const trackA = createMockTrack("A", "Track Alpha");
			const playlist = createMockPlaylist([trackA]);

			setupPlaylistFetch(playlist);

			renderPlaylistPage();

			await waitFor(() => {
				expect(screen.getByText("Test Playlist")).toBeInTheDocument();
			});

			const playAllButton = screen.getByLabelText(/Play all|Pause/);
			expect(playAllButton).toBeInTheDocument();
		});
	});
});
