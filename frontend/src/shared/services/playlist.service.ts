import { apiService } from "./api.service";
import type { Playlist } from "../types";

export interface CreatePlaylistInput {
	name: string;
	description?: string;
}

export interface UpdatePlaylistInput {
	name?: string;
	description?: string;
}

export const playlistsService = {
	async getAll(): Promise<Playlist[]> {
		return apiService.get<Playlist[]>("/api/playlists");
	},

	async getById(id: string): Promise<Playlist> {
		return apiService.get<Playlist>(`/api/playlists/${id}`);
	},

	async create(input: CreatePlaylistInput): Promise<Playlist> {
		return apiService.post<Playlist>("/api/playlists", input);
	},

	async update(id: string, input: UpdatePlaylistInput): Promise<Playlist> {
		return apiService.patch<Playlist>(`/api/playlists/${id}`, input);
	},

	async delete(id: string): Promise<void> {
		await apiService.delete(`/api/playlists/${id}`);
	},

	async reorderTracks(playlistId: string, trackIds: string[]): Promise<Playlist> {
		return apiService.patch<Playlist>(`/api/playlists/${playlistId}/reorder`, {
			trackIds,
		});
	},

	async addTrack(playlistId: string, trackId: string): Promise<Playlist> {
		return apiService.post<Playlist>(`/api/playlists/${playlistId}/tracks`, {
			trackId,
		});
	},

	async removeTrack(playlistId: string, trackId: string): Promise<Playlist> {
		return apiService.delete<Playlist>(
			`/api/playlists/${playlistId}/tracks/${trackId}`
		);
	},
};

// Backward compatibility alias
export const playlistService = playlistsService;
