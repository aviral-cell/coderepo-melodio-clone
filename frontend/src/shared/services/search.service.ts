import { apiService } from "./api.service";
import type { TrackWithPopulated } from "../types/player.types";
import { normalizeTracks } from "../utils";

export interface SearchResult {
	tracks: TrackWithPopulated[];
}

export const searchService = {
	async search(query: string): Promise<SearchResult> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await apiService.get<any>(
			`/api/search?q=${encodeURIComponent(query)}`
		);
		return {
			...response,
			tracks: response.tracks ? normalizeTracks(response.tracks) as TrackWithPopulated[] : [],
		};
	},
};
