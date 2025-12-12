import { apiService } from "./api.service";
import type { Track, PaginatedResponse } from "../types";
import type { TrackWithPopulated } from "../types/player.types";
import { normalizeTrack, normalizeTracks } from "../utils";

/**
 * Query parameters for fetching tracks
 */
export interface TrackQueryParams {
	page?: number;
	limit?: number;
	genre?: string;
	artistId?: string;
	albumId?: string;
}

/**
 * Build URL search params from query object
 */
function buildSearchParams(params?: TrackQueryParams): string {
	if (!params) return "";

	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set("page", params.page.toString());
	}
	if (params.limit) {
		searchParams.set("limit", params.limit.toString());
	}
	if (params.genre) {
		searchParams.set("genre", params.genre);
	}
	if (params.artistId) {
		searchParams.set("artistId", params.artistId);
	}
	if (params.albumId) {
		searchParams.set("albumId", params.albumId);
	}

	const query = searchParams.toString();
	return query ? `?${query}` : "";
}

export const tracksService = {
	/**
	 * Get paginated list of tracks
	 * Optional filters: genre, artistId, albumId
	 */
	async getAll(
		params?: TrackQueryParams,
	): Promise<PaginatedResponse<TrackWithPopulated>> {
		const queryString = buildSearchParams(params);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await apiService.get<PaginatedResponse<any>>(
			`/api/tracks${queryString}`,
		);
		return {
			...response,
			items: normalizeTracks(response.items) as TrackWithPopulated[],
		};
	},

	/**
	 * Get a single track by ID with populated artist and album
	 */
	async getById(id: string): Promise<TrackWithPopulated> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await apiService.get<any>(`/api/tracks/${id}`);
		return normalizeTrack(response) as TrackWithPopulated;
	},

	/**
	 * Get tracks by genre
	 */
	async getByGenre(
		genre: string,
		params?: Omit<TrackQueryParams, "genre">,
	): Promise<PaginatedResponse<TrackWithPopulated>> {
		return this.getAll({ ...params, genre });
	},

	/**
	 * Get recommended tracks (top played tracks)
	 */
	async getRecommended(
		limit: number = 10,
	): Promise<PaginatedResponse<TrackWithPopulated>> {
		return this.getAll({ limit });
	},

	/**
	 * Search tracks by title prefix or genre
	 */
	async search(query: string): Promise<TrackWithPopulated[]> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await apiService.get<any[]>(
			`/api/tracks/search?q=${encodeURIComponent(query)}`,
		);
		return normalizeTracks(response) as TrackWithPopulated[];
	},

	/**
	 * Log a track play (increment play count)
	 */
	async logPlay(id: string): Promise<Track> {
		return apiService.post<Track>(`/api/tracks/${id}/play`);
	},
};
