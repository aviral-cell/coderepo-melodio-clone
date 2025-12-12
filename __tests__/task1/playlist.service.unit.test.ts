/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Playlist Service Unit Tests (HackerRank Task 1 - Frontend)
 *
 * Tests the playlist.service.ts file to verify correct HTTP methods and request bodies.
 * These tests mock the apiService to verify the frontend service makes correct API calls.
 *
 * SCENARIO: Testing all playlist service methods
 * EXPECTATION:
 * - getAll should use GET method
 * - getById should use GET method
 * - create should use POST method with { name, description? } body
 * - update should use PATCH method with { name?, description? } body
 * - delete should use DELETE method
 * - reorderTracks should use PATCH method with { trackIds: [...] } body
 * - addTrack should use POST method with { trackId } body
 * - removeTrack should use DELETE method
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

jest.mock("@/shared/utils", () => ({
	normalizeTracks: jest.fn((tracks) => tracks),
}));

import { playlistService } from "@/shared/services/playlist.service";

describe("Playlist Service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getAll", () => {
		it("should call GET method for playlists endpoint", async () => {
			const mockResponse = [
				{ id: "playlist-1", name: "My Playlist", trackIds: [] },
				{ id: "playlist-2", name: "Another Playlist", trackIds: [] },
			];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await playlistService.getAll();

			expect(mockApiService.get).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists", async () => {
			const mockResponse = [{ id: "playlist-1", name: "My Playlist", trackIds: [] }];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await playlistService.getAll();

			expect(mockApiService.get).toHaveBeenCalledWith("/api/playlists");
		});

		it("should return the API response", async () => {
			const mockResponse = [
				{ id: "playlist-1", name: "My Playlist", trackIds: ["t1", "t2"] },
				{ id: "playlist-2", name: "Another Playlist", trackIds: ["t3"] },
			];
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.getAll();

			expect(result).toEqual(mockResponse);
		});
	});

	describe("getById", () => {
		it("should call GET method for single playlist endpoint", async () => {
			const mockResponse = { id: "playlist-123", name: "My Playlist", tracks: [] };
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await playlistService.getById("playlist-123");

			expect(mockApiService.get).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists/:id", async () => {
			const mockResponse = { id: "playlist-123", name: "My Playlist", tracks: [] };
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			await playlistService.getById("playlist-123");

			expect(mockApiService.get).toHaveBeenCalledWith("/api/playlists/playlist-123");
		});

		it("should return the API response with normalized tracks", async () => {
			const mockResponse = {
				id: "playlist-123",
				name: "My Playlist",
				tracks: [{ id: "t1", title: "Track 1" }],
			};
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.getById("playlist-123");

			expect(result.id).toBe("playlist-123");
			expect(result.name).toBe("My Playlist");
			expect(result.tracks).toBeDefined();
		});

		it("should handle response without tracks", async () => {
			const mockResponse = { id: "playlist-123", name: "My Playlist" };
			mockApiService.get.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.getById("playlist-123");

			expect(result.id).toBe("playlist-123");
			expect(result.tracks).toBeUndefined();
		});
	});

	describe("create", () => {
		it("should call POST method for create playlist endpoint", async () => {
			const mockResponse = { id: "new-playlist", name: "New Playlist", trackIds: [] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.create({ name: "New Playlist" });

			expect(mockApiService.post).toHaveBeenCalledTimes(1);
			expect(mockApiService.get).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists", async () => {
			const mockResponse = { id: "new-playlist", name: "New Playlist", trackIds: [] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.create({ name: "New Playlist" });

			expect(mockApiService.post).toHaveBeenCalledWith("/api/playlists", expect.any(Object));
		});

		it("should send name in request body", async () => {
			const mockResponse = { id: "new-playlist", name: "New Playlist", trackIds: [] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.create({ name: "New Playlist" });

			expect(mockApiService.post).toHaveBeenCalledWith(expect.any(String), { name: "New Playlist" });
		});

		it("should send name and description in request body when provided", async () => {
			const mockResponse = {
				id: "new-playlist",
				name: "New Playlist",
				description: "My description",
				trackIds: [],
			};
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.create({ name: "New Playlist", description: "My description" });

			expect(mockApiService.post).toHaveBeenCalledWith(expect.any(String), {
				name: "New Playlist",
				description: "My description",
			});
		});

		it("should return the API response", async () => {
			const mockResponse = { id: "new-playlist", name: "New Playlist", trackIds: [] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.create({ name: "New Playlist" });

			expect(result).toEqual(mockResponse);
		});
	});

	describe("update", () => {
		it("should call PATCH method for update playlist endpoint", async () => {
			const mockResponse = { id: "playlist-123", name: "Updated Name", trackIds: [] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.update("playlist-123", { name: "Updated Name" });

			expect(mockApiService.patch).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists/:id", async () => {
			const mockResponse = { id: "playlist-123", name: "Updated Name", trackIds: [] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.update("playlist-123", { name: "Updated Name" });

			expect(mockApiService.patch).toHaveBeenCalledWith("/api/playlists/playlist-123", expect.any(Object));
		});

		it("should send name in request body when provided", async () => {
			const mockResponse = { id: "playlist-123", name: "Updated Name", trackIds: [] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.update("playlist-123", { name: "Updated Name" });

			expect(mockApiService.patch).toHaveBeenCalledWith(expect.any(String), { name: "Updated Name" });
		});

		it("should send description in request body when provided", async () => {
			const mockResponse = {
				id: "playlist-123",
				name: "My Playlist",
				description: "Updated description",
				trackIds: [],
			};
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.update("playlist-123", { description: "Updated description" });

			expect(mockApiService.patch).toHaveBeenCalledWith(expect.any(String), {
				description: "Updated description",
			});
		});

		it("should send both name and description when provided", async () => {
			const mockResponse = {
				id: "playlist-123",
				name: "Updated Name",
				description: "Updated description",
				trackIds: [],
			};
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.update("playlist-123", {
				name: "Updated Name",
				description: "Updated description",
			});

			expect(mockApiService.patch).toHaveBeenCalledWith(expect.any(String), {
				name: "Updated Name",
				description: "Updated description",
			});
		});

		it("should return the API response", async () => {
			const mockResponse = { id: "playlist-123", name: "Updated Name", trackIds: ["t1"] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.update("playlist-123", { name: "Updated Name" });

			expect(result).toEqual(mockResponse);
		});
	});

	describe("delete", () => {
		it("should call DELETE method for delete playlist endpoint", async () => {
			mockApiService.delete.mockResolvedValueOnce(undefined);

			await playlistService.delete("playlist-123");

			expect(mockApiService.delete).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists/:id", async () => {
			mockApiService.delete.mockResolvedValueOnce(undefined);

			await playlistService.delete("playlist-123");

			expect(mockApiService.delete).toHaveBeenCalledWith("/api/playlists/playlist-123");
		});

		it("should not return a value", async () => {
			mockApiService.delete.mockResolvedValueOnce(undefined);

			const result = await playlistService.delete("playlist-123");

			expect(result).toBeUndefined();
		});
	});

	describe("reorderTracks", () => {
		it("should call PATCH method for reorder endpoint", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3"] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.reorderTracks("playlist-123", ["t1", "t2", "t3"]);

			expect(mockApiService.patch).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists/:id/reorder", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3"] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.reorderTracks("playlist-123", ["t1", "t2", "t3"]);

			expect(mockApiService.patch).toHaveBeenCalledWith("/api/playlists/playlist-123/reorder", expect.any(Object));
		});

		it("should send trackIds in request body (not tracks)", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3"] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			await playlistService.reorderTracks("playlist-123", ["t1", "t2", "t3"]);

			expect(mockApiService.patch).toHaveBeenCalledWith(expect.any(String), { trackIds: ["t1", "t2", "t3"] });
		});

		it("should return the API response", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t3", "t1", "t2"] };
			mockApiService.patch.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.reorderTracks("playlist-123", ["t3", "t1", "t2"]);

			expect(result).toEqual(mockResponse);
		});
	});

	describe("addTrack", () => {
		it("should call POST method for add track endpoint", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3"] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.addTrack("playlist-123", "t3");

			expect(mockApiService.post).toHaveBeenCalledTimes(1);
			expect(mockApiService.patch).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists/:playlistId/tracks", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3"] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.addTrack("playlist-123", "track-456");

			expect(mockApiService.post).toHaveBeenCalledWith("/api/playlists/playlist-123/tracks", expect.any(Object));
		});

		it("should send trackId in request body", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3"] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			await playlistService.addTrack("playlist-123", "track-456");

			expect(mockApiService.post).toHaveBeenCalledWith(expect.any(String), { trackId: "track-456" });
		});

		it("should return the API response", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t2", "t3", "new-track"] };
			mockApiService.post.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.addTrack("playlist-123", "new-track");

			expect(result).toEqual(mockResponse);
		});
	});

	describe("removeTrack", () => {
		it("should call DELETE method for remove track endpoint", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t3"] };
			mockApiService.delete.mockResolvedValueOnce(mockResponse);

			await playlistService.removeTrack("playlist-123", "t2");

			expect(mockApiService.delete).toHaveBeenCalledTimes(1);
			expect(mockApiService.post).not.toHaveBeenCalled();
		});

		it("should call correct endpoint /api/playlists/:playlistId/tracks/:trackId", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1", "t3"] };
			mockApiService.delete.mockResolvedValueOnce(mockResponse);

			await playlistService.removeTrack("playlist-123", "track-456");

			expect(mockApiService.delete).toHaveBeenCalledWith("/api/playlists/playlist-123/tracks/track-456");
		});

		it("should return the API response", async () => {
			const mockResponse = { id: "playlist-123", trackIds: ["t1"] };
			mockApiService.delete.mockResolvedValueOnce(mockResponse);

			const result = await playlistService.removeTrack("playlist-123", "t2");

			expect(result).toEqual(mockResponse);
		});
	});
});
