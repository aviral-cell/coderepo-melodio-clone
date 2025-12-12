import { apiService } from "./api.service";
import type { TrackWithPopulated } from "../types/player.types";

export interface SearchResult {
	tracks: TrackWithPopulated[];
}

export const searchService = {
	async search(query: string): Promise<SearchResult> {
		return apiService.get<SearchResult>(
			`/api/search?q=${encodeURIComponent(query)}`
		);
	},
};
