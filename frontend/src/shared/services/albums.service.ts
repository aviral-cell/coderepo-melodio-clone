import { apiService } from "./api.service";
import type { Album, Artist, PaginatedResponse } from "../types";
import type { TrackWithPopulated } from "../types/player.types";

export interface AlbumWithPopulated extends Omit<Album, "artistId" | "artist"> {
	artistId: Pick<Artist, "_id" | "name" | "imageUrl">;
	tracks?: TrackWithPopulated[];
}

interface BackendAlbumResponse {
	_id: string;
	title: string;
	artist?: {
		_id: string;
		name: string;
		imageUrl?: string;
	};
	artistId?: {
		_id: string;
		name: string;
		imageUrl?: string;
	};
	releaseDate: string;
	coverImageUrl?: string;
	totalTracks: number;
	createdAt: string;
	updatedAt: string;
}

function normalizeAlbum(raw: BackendAlbumResponse): AlbumWithPopulated {
	const artistData = raw.artist ?? raw.artistId ?? { _id: "", name: "Unknown Artist" };
	return {
		_id: raw._id,
		title: raw.title,
		artistId: {
			_id: artistData._id,
			name: artistData.name,
			imageUrl: artistData.imageUrl,
		},
		releaseDate: raw.releaseDate,
		coverImageUrl: raw.coverImageUrl,
		totalTracks: raw.totalTracks,
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt,
	};
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
		const response = await apiService.get<PaginatedResponse<BackendAlbumResponse>>(
			`/api/albums${queryString}`,
		);
		return {
			...response,
			items: response.items.map(normalizeAlbum),
		};
	},

	async getById(id: string): Promise<AlbumWithPopulated> {
		const response = await apiService.get<BackendAlbumResponse>(`/api/albums/${id}`);
		return normalizeAlbum(response);
	},

	async search(query: string): Promise<AlbumWithPopulated[]> {
		const response = await apiService.get<BackendAlbumResponse[]>(
			`/api/albums/search?q=${encodeURIComponent(query)}`,
		);
		return response.map(normalizeAlbum);
	},
};

export const albumService = albumsService;
