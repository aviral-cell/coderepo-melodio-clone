import { apiService } from "./api.service";

export interface RecentlyPlayedTrack {
	id: string;
	title: string;
	durationInSeconds: number;
	coverImageUrl: string;
	playedAt: string;
	artist: {
		id: string;
		name: string;
	};
	album: {
		id: string;
		title: string;
	};
}

export interface RecentlyPlayedResponse {
	tracks: RecentlyPlayedTrack[];
	total: number;
}

export const historyService = {
	async getRecentlyPlayed(limit: number = 20, offset: number = 0): Promise<RecentlyPlayedResponse> {
		return apiService.get<RecentlyPlayedResponse>(`/api/history/recently-played?limit=${limit}&offset=${offset}`);
	},

	async recordPlay(trackId: string): Promise<void> {
		await apiService.post("/api/history/play", { trackId });
	},

	async clearHistory(): Promise<void> {
		await apiService.delete("/api/history/recently-played");
	},
};
