import { apiService } from "./api.service";
import type { Album, Artist, PaginatedResponse } from "../types";
import type { TrackWithPopulated } from "../types/player.types";

export interface AlbumWithPopulated extends Omit<Album, "artistId" | "artist"> {
	artistId: Pick<Artist, "_id" | "name" | "imageUrl">;
	tracks?: TrackWithPopulated[];
}

export interface AlbumQueryParams {
	page?: number;
	limit?: number;
	artistId?: string;
}

function buildSearchParams(params?: AlbumQueryParams): string {
	if (!params) return "";

	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set("page", params.page.toString());
	}
	if (params.limit) {
		searchParams.set("limit", params.limit.toString());
	}
	if (params.artistId) {
		searchParams.set("artistId", params.artistId);
	}

	const query = searchParams.toString();
	return query ? `?${query}` : "";
}

export const albumsService = {
	async getAll(
		params?: AlbumQueryParams,
	): Promise<PaginatedResponse<AlbumWithPopulated>> {
		const queryString = buildSearchParams(params);
		return apiService.get<PaginatedResponse<AlbumWithPopulated>>(
			`/api/albums${queryString}`,
		);
	},

	async getById(id: string): Promise<AlbumWithPopulated> {
		return apiService.get<AlbumWithPopulated>(`/api/albums/${id}`);
	},

	async search(query: string): Promise<AlbumWithPopulated[]> {
		return apiService.get<AlbumWithPopulated[]>(
			`/api/albums/search?q=${encodeURIComponent(query)}`,
		);
	},
};

export const albumService = albumsService;
