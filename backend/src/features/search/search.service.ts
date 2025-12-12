import { tracksService, TrackResponse } from "../tracks/tracks.service.js";

export interface SearchResults {
	tracks: TrackResponse[];
}

export const searchService = {
	async search(query: string): Promise<SearchResults> {
		if (!query || query.trim() === "") {
			return { tracks: [] };
		}

		const tracks = await tracksService.search(query, 5);

		return { tracks };
	},
};
