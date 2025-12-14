/**
 * @jest-environment jsdom
 */

/**
 * INTRO: usePlaylistOperations Hook Tests
 * SCENARIO: Testing reorder/remove operations with optimistic UI updates
 * EXPECTATION: UI updates immediately, rolls back on API failure
 */

import { renderHook, waitFor, act } from "@testing-library/react";

const mockPlaylistService = {
	reorderTracks: jest.fn(),
	removeTrack: jest.fn(),
};

jest.mock("@/shared/services/playlist.service", () => ({
	playlistService: mockPlaylistService,
}));

import { usePlaylistOperations } from "@/shared/hooks/usePlaylistOperations";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const createMockTrack = (id: string): TrackWithPopulated => ({
	_id: id,
	title: `Track ${id}`,
	duration: 180,
	trackNumber: 1,
	audioUrl: `http://example.com/${id}.mp3`,
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
	artistId: {
		_id: "artist-1",
		name: "Test Artist",
		imageUrl: "http://example.com/artist.jpg",
	},
	albumId: {
		_id: "album-1",
		title: "Test Album",
		coverImageUrl: "http://example.com/album.jpg",
	},
});

describe("usePlaylistOperations", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("reorderTracks", () => {
		it("should optimistically update UI on reorder", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const initialTracks = [trackA, trackB, trackC];

			const setPlaylist = jest.fn();
			mockPlaylistService.reorderTracks.mockResolvedValueOnce({});

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.reorderTracks(0, 2);
			});

			expect(setPlaylist).toHaveBeenCalledWith([trackB, trackC, trackA]);
			expect(mockPlaylistService.reorderTracks).toHaveBeenCalledWith(
				"playlist-123",
				["B", "C", "A"]
			);
		});

		it("should roll back on API failure", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const initialTracks = [trackA, trackB, trackC];

			const setPlaylist = jest.fn();
			const onError = jest.fn();
			mockPlaylistService.reorderTracks.mockRejectedValueOnce(
				new Error("API Error")
			);

			const { result } = renderHook(() =>
				usePlaylistOperations(
					"playlist-123",
					initialTracks,
					setPlaylist,
					onError
				)
			);

			await act(async () => {
				await result.current.reorderTracks(0, 2);
			});

			expect(setPlaylist).toHaveBeenNthCalledWith(1, [trackB, trackC, trackA]);
			expect(setPlaylist).toHaveBeenNthCalledWith(2, [trackA, trackB, trackC]);
			expect(onError).toHaveBeenCalledWith(expect.any(Error));
		});

		it("should do nothing when reordering to same index", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const initialTracks = [trackA, trackB, trackC];

			const setPlaylist = jest.fn();

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.reorderTracks(1, 1);
			});

			expect(setPlaylist).not.toHaveBeenCalled();
			expect(mockPlaylistService.reorderTracks).not.toHaveBeenCalled();
		});

		it("should set isReordering to true during API call", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const initialTracks = [trackA, trackB];

			let resolvePromise: () => void;
			const pendingPromise = new Promise<void>((resolve) => {
				resolvePromise = resolve;
			});
			mockPlaylistService.reorderTracks.mockReturnValueOnce(pendingPromise);

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, jest.fn())
			);

			expect(result.current.isReordering).toBe(false);

			act(() => {
				result.current.reorderTracks(0, 1);
			});

			await waitFor(() => {
				expect(result.current.isReordering).toBe(true);
			});

			await act(async () => {
				resolvePromise!();
			});

			await waitFor(() => {
				expect(result.current.isReordering).toBe(false);
			});
		});

		it("should handle reorder from first to last position", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const trackD = createMockTrack("D");
			const initialTracks = [trackA, trackB, trackC, trackD];

			const setPlaylist = jest.fn();
			mockPlaylistService.reorderTracks.mockResolvedValueOnce({});

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.reorderTracks(0, 3);
			});

			expect(setPlaylist).toHaveBeenCalledWith([trackB, trackC, trackD, trackA]);
			expect(mockPlaylistService.reorderTracks).toHaveBeenCalledWith(
				"playlist-123",
				["B", "C", "D", "A"]
			);
		});

		it("should handle reorder from last to first position", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const trackD = createMockTrack("D");
			const initialTracks = [trackA, trackB, trackC, trackD];

			const setPlaylist = jest.fn();
			mockPlaylistService.reorderTracks.mockResolvedValueOnce({});

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.reorderTracks(3, 0);
			});

			expect(setPlaylist).toHaveBeenCalledWith([trackD, trackA, trackB, trackC]);
			expect(mockPlaylistService.reorderTracks).toHaveBeenCalledWith(
				"playlist-123",
				["D", "A", "B", "C"]
			);
		});
	});

	describe("removeTrack", () => {
		it("should optimistically update UI on remove", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const initialTracks = [trackA, trackB, trackC];

			const setPlaylist = jest.fn();
			mockPlaylistService.removeTrack.mockResolvedValueOnce({});

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.removeTrack("B");
			});

			expect(setPlaylist).toHaveBeenCalledWith([trackA, trackC]);
			expect(mockPlaylistService.removeTrack).toHaveBeenCalledWith(
				"playlist-123",
				"B"
			);
		});

		it("should roll back on API failure", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");
			const initialTracks = [trackA, trackB, trackC];

			const setPlaylist = jest.fn();
			const onError = jest.fn();
			mockPlaylistService.removeTrack.mockRejectedValueOnce(
				new Error("API Error")
			);

			const { result } = renderHook(() =>
				usePlaylistOperations(
					"playlist-123",
					initialTracks,
					setPlaylist,
					onError
				)
			);

			await act(async () => {
				await result.current.removeTrack("B");
			});

			expect(setPlaylist).toHaveBeenNthCalledWith(1, [trackA, trackC]);
			expect(setPlaylist).toHaveBeenNthCalledWith(2, [trackA, trackB, trackC]);
			expect(onError).toHaveBeenCalledWith(expect.any(Error));
		});

		it("should set isRemoving to true during API call", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const initialTracks = [trackA, trackB];

			let resolvePromise: () => void;
			const pendingPromise = new Promise<void>((resolve) => {
				resolvePromise = resolve;
			});
			mockPlaylistService.removeTrack.mockReturnValueOnce(pendingPromise);

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, jest.fn())
			);

			expect(result.current.isRemoving).toBe(false);

			act(() => {
				result.current.removeTrack("A");
			});

			await waitFor(() => {
				expect(result.current.isRemoving).toBe(true);
			});

			await act(async () => {
				resolvePromise!();
			});

			await waitFor(() => {
				expect(result.current.isRemoving).toBe(false);
			});
		});

		it("should handle removing non-existent track gracefully", async () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const initialTracks = [trackA, trackB];

			const setPlaylist = jest.fn();
			mockPlaylistService.removeTrack.mockResolvedValueOnce({});

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.removeTrack("NON_EXISTENT");
			});

			// Should still call setPlaylist with filtered result (same array since no match)
			expect(setPlaylist).toHaveBeenCalledWith([trackA, trackB]);
			expect(mockPlaylistService.removeTrack).toHaveBeenCalledWith(
				"playlist-123",
				"NON_EXISTENT"
			);
		});

		it("should handle removing the last remaining track", async () => {
			const trackA = createMockTrack("A");
			const initialTracks = [trackA];

			const setPlaylist = jest.fn();
			mockPlaylistService.removeTrack.mockResolvedValueOnce({});

			const { result } = renderHook(() =>
				usePlaylistOperations("playlist-123", initialTracks, setPlaylist)
			);

			await act(async () => {
				await result.current.removeTrack("A");
			});

			expect(setPlaylist).toHaveBeenCalledWith([]);
			expect(mockPlaylistService.removeTrack).toHaveBeenCalledWith(
				"playlist-123",
				"A"
			);
		});
	});
});
