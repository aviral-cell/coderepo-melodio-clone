/**
 * @jest-environment jsdom
 */

/**
 * INTRO: useSearch Hook Tests
 *
 * Tests for the useSearch hook which provides search functionality with debouncing.
 *
 * SCENARIO: Testing search execution, debouncing, loading states, and error handling
 * EXPECTATION: Search uses debounced value, handles loading/error states correctly
 */

import { renderHook, waitFor, act } from "@testing-library/react";

const mockSearchService = {
	search: jest.fn(),
};

jest.mock("@/shared/services/search.service", () => ({
	searchService: mockSearchService,
}));

jest.mock("@/shared/hooks/useDebounce", () => ({
	useDebounce: jest.fn((value: string) => value),
}));

import { useSearch } from "@/shared/hooks/useSearch";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>;

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

describe("useSearch", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseDebounce.mockImplementation((value: string) => value);
	});

	describe("Search Execution", () => {
		it("should call API with debounced value", async () => {
			mockUseDebounce.mockReturnValue("debounced");
			mockSearchService.search.mockResolvedValueOnce({
				tracks: [createMockTrack("1")],
			});

			renderHook(() => useSearch("original"));

			await waitFor(() => {
				expect(mockSearchService.search).toHaveBeenCalledWith("debounced");
			});
		});

		it("should return tracks only", async () => {
			const mockTracks = [createMockTrack("1"), createMockTrack("2")];
			mockSearchService.search.mockResolvedValueOnce({ tracks: mockTracks });

			const { result } = renderHook(() => useSearch("Thunder"));

			await waitFor(() => {
				expect(result.current.tracks).toHaveLength(2);
			});

			expect(result.current.tracks[0]._id).toBe("1");
			expect(result.current.tracks[1]._id).toBe("2");
		});

		it("should return empty results for empty query without API call", async () => {
			const { result } = renderHook(() => useSearch(""));

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.tracks).toEqual([]);
			expect(mockSearchService.search).not.toHaveBeenCalled();
		});

		it("should return empty results for whitespace query without API call", async () => {
			mockUseDebounce.mockReturnValue("   ");

			const { result } = renderHook(() => useSearch("   "));

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.tracks).toEqual([]);
			expect(mockSearchService.search).not.toHaveBeenCalled();
		});
	});

	describe("Loading States", () => {
		it("should set isLoading to true during fetch", async () => {
			let resolvePromise: (value: { tracks: TrackWithPopulated[] }) => void;
			const pendingPromise = new Promise<{ tracks: TrackWithPopulated[] }>(
				(resolve) => {
					resolvePromise = resolve;
				}
			);
			mockSearchService.search.mockReturnValueOnce(pendingPromise);

			const { result } = renderHook(() => useSearch("test"));

			await waitFor(() => {
				expect(result.current.isLoading).toBe(true);
			});

			act(() => {
				resolvePromise!({ tracks: [] });
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
		});
	});

	describe("Error Handling", () => {
		it("should set error state on API error", async () => {
			mockSearchService.search.mockRejectedValueOnce(new Error("Network error"));

			const { result } = renderHook(() => useSearch("test"));

			await waitFor(() => {
				expect(result.current.error).toBe("Network error");
			});

			expect(result.current.tracks).toEqual([]);
		});

		it("should use generic message for non-Error exceptions", async () => {
			mockSearchService.search.mockRejectedValueOnce("string error");

			const { result } = renderHook(() => useSearch("test"));

			await waitFor(() => {
				expect(result.current.error).toBe("Search failed");
			});
		});

		it("should clear error when query becomes empty", async () => {
			mockSearchService.search.mockRejectedValueOnce(new Error("Network error"));

			const { result, rerender } = renderHook(
				({ query }) => useSearch(query),
				{ initialProps: { query: "test" } }
			);

			await waitFor(() => {
				expect(result.current.error).toBe("Network error");
			});

			mockUseDebounce.mockReturnValue("");
			rerender({ query: "" });

			await waitFor(() => {
				expect(result.current.error).toBeNull();
			});

			expect(result.current.tracks).toEqual([]);
		});
	});

	describe("Query Changes", () => {
		it("should fetch new results when query changes", async () => {
			mockSearchService.search
				.mockResolvedValueOnce({ tracks: [createMockTrack("1")] })
				.mockResolvedValueOnce({ tracks: [createMockTrack("2")] });

			const { result, rerender } = renderHook(
				({ query }) => useSearch(query),
				{ initialProps: { query: "first" } }
			);

			await waitFor(() => {
				expect(result.current.tracks[0]._id).toBe("1");
			});

			mockUseDebounce.mockReturnValue("second");
			rerender({ query: "second" });

			await waitFor(() => {
				expect(result.current.tracks[0]._id).toBe("2");
			});
		});
	});
});
