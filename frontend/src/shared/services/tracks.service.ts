import { apiService } from "./api.service";
import type { Track, PaginatedResponse } from "../types";
import type { TrackWithPopulated } from "../types/player.types";
import { normalizeTrack, normalizeTracks } from "../utils";

export interface TrackQueryParams {
	page?: number;
	limit?: number;
	genre?: string;
	artistId?: string;
	albumId?: string;
}

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
	async getAll(
		params?: TrackQueryParams,
	): Promise<PaginatedResponse<TrackWithPopulated>> {
		const queryString = buildSearchParams(params);
		const response = await apiService.get<PaginatedResponse<any>>(
			`/api/tracks${queryString}`,
		);
		return {
			...response,
			items: normalizeTracks(response.items) as TrackWithPopulated[],
		};
	},

	async getById(id: string): Promise<TrackWithPopulated> {
		const response = await apiService.get<any>(`/api/tracks/${id}`);
		return normalizeTrack(response) as TrackWithPopulated;
	},

	async getByGenre(
		genre: string,
		params?: Omit<TrackQueryParams, "genre">,
	): Promise<PaginatedResponse<TrackWithPopulated>> {
		return this.getAll({ ...params, genre });
	},

	async getRecommended(
		limit: number = 10,
	): Promise<PaginatedResponse<TrackWithPopulated>> {
		return this.getAll({ limit });
	},

	async search(query: string): Promise<TrackWithPopulated[]> {
		const response = await apiService.get<any[]>(
			`/api/tracks/search?q=${encodeURIComponent(query)}`,
		);
		return normalizeTracks(response) as TrackWithPopulated[];
	},

	async logPlay(id: string): Promise<Track> {
		return apiService.post<Track>(`/api/tracks/${id}/play`);
	},
};
