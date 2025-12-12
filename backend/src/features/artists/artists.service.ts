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

interface LeanArtist extends IArtist {
	_id: mongoose.Types.ObjectId;
}

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

	async findById(id: string): Promise<ArtistResponse | null> {
		const artist = await Artist.findById(id).lean<LeanArtist | null>().exec();

		if (!artist) {
			return null;
		}

		return transformArtist(artist);
	},

	async search(query: string, limit = 5): Promise<ArtistResponse[]> {
		if (!query || query.trim() === "") {
			return [];
		}

		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

		const artists = await Artist.find({
			name: { $regex: escapedQuery, $options: "i" },
		})
			.limit(limit)
			.lean<LeanArtist[]>()
			.exec();

		return artists.map((artist) => transformArtist(artist));
	},
};
