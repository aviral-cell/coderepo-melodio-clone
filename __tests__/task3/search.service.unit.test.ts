/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Search Service Unit Tests (HackerRank Task 3 - Frontend)
 *
 * Tests the search.service.ts file to verify correct HTTP methods and request handling.
 * These tests mock the apiService to verify the frontend service makes correct API calls.
 *
 * SCENARIO: Testing search service methods
 * EXPECTATION:
 * - search should use GET method
 * - search should call /api/search endpoint with query parameter
 * - search should properly encode query parameters
 * - search should return normalized tracks from API response
 * - search should handle missing tracks in response
 * - search should handle empty query string
 */

const mockApiService = {
	get: jest.fn(),
	post: jest.fn(),
	patch: jest.fn(),
	delete: jest.fn(),
};

jest.mock("@/shared/services/api.service", () => ({
	apiService: mockApiService,
}));

const mockNormalizeTracks = jest.fn((tracks) => tracks);

jest.mock("@/shared/utils", () => ({
	normalizeTracks: mockNormalizeTracks,
}));

import { searchService } from "@/shared/services/search.service";

describe("Search Service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("search", () => {
		it("should call GET method for search endpoint", async () => {
			const mockResponse = {
				tracks: [{ id: "track-1", title: "Test Track" }],
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("test");

			expect(mockApiService.get).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/search with query parameter", async () => {
			const mockResponse = {
				tracks: [{ id: "track-1", title: "Test Track" }],
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("rock music");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/search?q=rock%20music");
		});

		it("should properly encode the query parameter with special characters", async () => {
			const mockResponse = {
				tracks: [{ id: "track-1", title: "Test Track" }],
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("rock & roll + jazz");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/search?q=rock%20%26%20roll%20%2B%20jazz");
		});

		it("should return the API response with normalized tracks", async () => {
			const mockTracks = [
				{ id: "track-1", title: "Track 1", artist: { name: "Artist 1" } },
				{ id: "track-2", title: "Track 2", artist: { name: "Artist 2" } },
			];
			const mockResponse = {
				tracks: mockTracks,
				totalResults: 2,
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);
			mockNormalizeTracks.mockReturnValueOnce(mockTracks);

			const result = await searchService.search("test");

			expect(mockNormalizeTracks).toHaveBeenCalledWith(mockTracks);
			expect(result.tracks).toEqual(mockTracks);
			expect(result.totalResults).toBe(2);
		});

		it("should return empty tracks array when response has no tracks", async () => {
			const mockResponse = {
				totalResults: 0,
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			const result = await searchService.search("nonexistent");

			expect(mockNormalizeTracks).not.toHaveBeenCalled();
			expect(result.tracks).toEqual([]);
		});

		it("should handle empty query string", async () => {
			const mockResponse = {
				tracks: [],
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/search?q=");
		});
	});
});
