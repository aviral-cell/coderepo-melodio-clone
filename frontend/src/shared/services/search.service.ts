import { apiService } from "./api.service";
import type { TrackWithPopulated } from "../types/player.types";
import { normalizeTracks } from "../utils";

interface BackendTrackResponse {
	id: string;
	title: string;
	artist: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	album: {
		id: string;
		title: string;
		coverImageUrl?: string;
	};
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface SearchResult {
	tracks: TrackWithPopulated[];
}

export const searchService = {
	async search(query: string): Promise<SearchResult> {
		const response = await apiService.get<BackendTrackResponse[]>(
			`/api/tracks/search?q=${encodeURIComponent(query)}`
		);
		return {
			tracks: Array.isArray(response) ? normalizeTracks(response) as TrackWithPopulated[] : [],
		};
	},
};
