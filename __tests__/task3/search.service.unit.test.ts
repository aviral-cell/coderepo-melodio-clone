/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Search Service Unit Tests
 * SCENARIO: Testing frontend search service API calls
 * EXPECTATION: Correct HTTP method, endpoint, and response handling
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
			const mockResponse = [{ id: "track-1", title: "Test Track" }];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("test");

			expect(mockApiService.get).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/tracks/search with query parameter", async () => {
			const mockResponse = [{ id: "track-1", title: "Test Track" }];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("rock music");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/tracks/search?q=rock%20music");
		});

		it("should properly encode the query parameter with special characters", async () => {
			const mockResponse = [{ id: "track-1", title: "Test Track" }];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("rock & roll + jazz");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/tracks/search?q=rock%20%26%20roll%20%2B%20jazz");
		});

		it("should return normalized tracks wrapped in result object", async () => {
			const mockTracks = [
				{ id: "track-1", title: "Track 1", artist: { name: "Artist 1" } },
				{ id: "track-2", title: "Track 2", artist: { name: "Artist 2" } },
			];
			mockApiService.get.mockResolvedValueOnce(mockTracks);
			mockNormalizeTracks.mockReturnValueOnce(mockTracks);

			const result = await searchService.search("test");

			expect(mockNormalizeTracks).toHaveBeenCalledWith(mockTracks);
			expect(result.tracks).toEqual(mockTracks);
		});

		it("should return empty tracks array when response is not an array", async () => {
			mockApiService.get.mockResolvedValueOnce(null);

			const result = await searchService.search("nonexistent");

			expect(result.tracks).toEqual([]);
		});

		it("should handle empty query string", async () => {
			const mockResponse: unknown[] = [];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await searchService.search("");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/tracks/search?q=");
		});
	});
});
