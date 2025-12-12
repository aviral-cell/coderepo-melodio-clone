import mongoose from "mongoose";
import { Artist, IArtist } from "./artist.model.js";

export interface ArtistResponse {
	_id: string;
	name: string;
	bio?: string;
	imageUrl?: string;
	genres: string[];
	followerCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaginatedArtistsResponse {
	items: ArtistResponse[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Lean artist type for query results
 */
interface LeanArtist extends IArtist {
	_id: mongoose.Types.ObjectId;
}

/**
 * Transform artist document to API response format
 * Maps snake_case DB fields to camelCase API response
 */
function transformArtist(artist: LeanArtist): ArtistResponse {
	return {
		_id: artist._id.toString(),
		name: artist.name,
		bio: artist.bio,
		imageUrl: artist.image_url,
		genres: artist.genres,
		followerCount: artist.follower_count,
		createdAt: artist.created_at,
		updatedAt: artist.updated_at,
	};
}

export const artistsService = {
	/**
	 * Find all artists with pagination, sorted by followerCount descending
	 */
	async findAll(page: number, limit: number): Promise<PaginatedArtistsResponse> {
		const skip = (page - 1) * limit;

		const [artists, total] = await Promise.all([
			Artist.find()
				.sort({ follower_count: -1 })
				.skip(skip)
				.limit(limit)
				.lean<LeanArtist[]>()
				.exec(),
			Artist.countDocuments().exec(),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			items: artists.map((artist) => transformArtist(artist)),
			total,
			page,
			limit,
			totalPages,
		};
	},

	/**
	 * Find a single artist by ID
	 */
	async findById(id: string): Promise<ArtistResponse | null> {
		const artist = await Artist.findById(id).lean<LeanArtist | null>().exec();

		if (!artist) {
			return null;
		}

		return transformArtist(artist);
	},

	/**
	 * Search artists by name using case-insensitive regex for partial matching
	 * Falls back to text search if available, but regex provides better prefix matching
	 */
	async search(query: string, limit = 5): Promise<ArtistResponse[]> {
		if (!query || query.trim() === "") {
			return [];
		}

		// Escape special regex characters to prevent injection
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

		// Use case-insensitive regex for partial matching
		const artists = await Artist.find({
			name: { $regex: escapedQuery, $options: "i" },
		})
			.limit(limit)
			.lean<LeanArtist[]>()
			.exec();

		return artists.map((artist) => transformArtist(artist));
	},
};
