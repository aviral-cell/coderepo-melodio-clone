import { apiService } from "./api.service";
import type { Artist, PaginatedResponse } from "../types";
import type { AlbumWithPopulated } from "./albums.service";

/**
 * Artist with populated albums
 */
export interface ArtistWithAlbums extends Artist {
	albums?: AlbumWithPopulated[];
}

/**
 * Query parameters for fetching artists
 */
export interface ArtistQueryParams {
	page?: number;
	limit?: number;
}

/**
 * Build URL search params from query object
 */
function buildSearchParams(params?: ArtistQueryParams): string {
	if (!params) return "";

	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set("page", params.page.toString());
	}
	if (params.limit) {
		searchParams.set("limit", params.limit.toString());
	}

	const query = searchParams.toString();
	return query ? `?${query}` : "";
}

export const artistsService = {
	/**
	 * Get paginated list of artists
	 */
	async getAll(params?: ArtistQueryParams): Promise<PaginatedResponse<Artist>> {
		const queryString = buildSearchParams(params);
		return apiService.get<PaginatedResponse<Artist>>(
			`/api/artists${queryString}`,
		);
	},

	/**
	 * Get a single artist by ID with populated albums
	 */
	async getById(id: string): Promise<ArtistWithAlbums> {
		return apiService.get<ArtistWithAlbums>(`/api/artists/${id}`);
	},

	/**
	 * Search artists by name
	 */
	async search(query: string): Promise<Artist[]> {
		return apiService.get<Artist[]>(
			`/api/artists/search?q=${encodeURIComponent(query)}`,
		);
	},
};

// Backward compatibility alias
export const artistService = artistsService;
