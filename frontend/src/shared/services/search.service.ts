import { apiService } from "./api.service";
import type { TrackWithPopulated } from "../types/player.types";
import { normalizeTracks } from "../utils";

export interface SearchResult {
	tracks: TrackWithPopulated[];
}

export const searchService = {
	async search(query: string): Promise<SearchResult> {
		const response = await apiService.get<TrackWithPopulated[]>(
			`/api/tracks/search?q=${encodeURIComponent(query)}`
		);
		return {
			tracks: Array.isArray(response) ? normalizeTracks(response) as TrackWithPopulated[] : [],
		};
	},
};
