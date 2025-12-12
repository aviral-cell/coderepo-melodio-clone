import mongoose from "mongoose";
import { Album, IAlbum } from "./album.model.js";

/**
 * Artist data structure for populated responses
 * Uses snake_case as stored in DB
 */
export interface PopulatedArtist {
	_id: mongoose.Types.ObjectId;
	name: string;
	image_url?: string;
}

/**
 * Album response with populated artist
 */
export interface AlbumResponse {
	id: string;
	title: string;
	artist: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	releaseDate: Date;
	coverImageUrl?: string;
	totalTracks: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Paginated albums response
 */
export interface PaginatedAlbumsResponse {
	items: AlbumResponse[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Lean album type with populated artist for query results
 */
interface LeanAlbumWithArtist extends Omit<IAlbum, "artist_id"> {
	_id: mongoose.Types.ObjectId;
	artist_id: PopulatedArtist | null;
}

/**
 * Transform album document to API response format
 * Maps snake_case DB fields to camelCase API response
 */
function transformAlbum(album: LeanAlbumWithArtist): AlbumResponse {
	const artist = album.artist_id;

	return {
		id: album._id.toString(),
		title: album.title,
		artist: {
			id: artist?._id?.toString() ?? "",
			name: artist?.name ?? "",
			imageUrl: artist?.image_url,
		},
		releaseDate: album.release_date,
		coverImageUrl: album.cover_image_url,
		totalTracks: album.total_tracks,
		createdAt: album.created_at,
		updatedAt: album.updated_at,
	};
}

export const albumsService = {
	/**
	 * Find all albums with pagination, sorted by releaseDate descending
	 * Optionally filter by artistId
	 */
	async findAll(
		page: number,
		limit: number,
		artistId?: string,
	): Promise<PaginatedAlbumsResponse> {
		const skip = (page - 1) * limit;

		// Build query filter
		const filter: Record<string, unknown> = {};
		if (artistId) {
			filter["artist_id"] = new mongoose.Types.ObjectId(artistId);
		}

		const [albums, total] = await Promise.all([
			Album.find(filter)
				.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
				.sort({ release_date: -1 })
				.skip(skip)
				.limit(limit)
				.lean<LeanAlbumWithArtist[]>()
				.exec(),
			Album.countDocuments(filter).exec(),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			items: albums.map((album) => transformAlbum(album)),
			total,
			page,
			limit,
			totalPages,
		};
	},

	/**
	 * Find a single album by ID with populated artist
	 */
	async findById(id: string): Promise<AlbumResponse | null> {
		const album = await Album.findById(id)
			.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
			.lean<LeanAlbumWithArtist | null>()
			.exec();

		if (!album) {
			return null;
		}

		return transformAlbum(album);
	},

	/**
	 * Search albums by title using text search
	 * Returns max 5 results by default
	 */
	async search(query: string, limit = 5): Promise<AlbumResponse[]> {
		if (!query || query.trim() === "") {
			return [];
		}

		// Use text search for full-text matching
		const albums = await Album.find(
			{ $text: { $search: query } },
			{ score: { $meta: "textScore" } },
		)
			.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
			.sort({ score: { $meta: "textScore" } })
			.limit(limit)
			.lean<LeanAlbumWithArtist[]>()
			.exec();

		return albums.map((album) => transformAlbum(album));
	},
};
