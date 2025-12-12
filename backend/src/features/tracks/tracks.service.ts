import mongoose from "mongoose";
import { Track, ITrack } from "./track.model.js";

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
 * Album data structure for populated responses
 * Uses snake_case as stored in DB
 */
export interface PopulatedAlbum {
	_id: mongoose.Types.ObjectId;
	title: string;
	cover_image_url?: string;
}

/**
 * Track response with populated artist and album
 */
export interface TrackResponse {
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
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Paginated tracks response
 */
export interface PaginatedTracksResponse {
	items: TrackResponse[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Lean track type with populated artist and album for query results
 */
interface LeanTrackWithPopulated extends Omit<ITrack, "artist_id" | "album_id"> {
	_id: mongoose.Types.ObjectId;
	artist_id: PopulatedArtist | null;
	album_id: PopulatedAlbum | null;
}

/**
 * Transform track document to API response format
 * Maps snake_case DB fields to camelCase API response
 */
function transformTrack(track: LeanTrackWithPopulated): TrackResponse {
	const artist = track.artist_id;
	const album = track.album_id;

	return {
		id: track._id.toString(),
		title: track.title,
		artist: {
			id: artist?._id?.toString() ?? "",
			name: artist?.name ?? "",
			imageUrl: artist?.image_url,
		},
		album: {
			id: album?._id?.toString() ?? "",
			title: album?.title ?? "",
			coverImageUrl: album?.cover_image_url,
		},
		durationInSeconds: track.duration_in_seconds,
		trackNumber: track.track_number,
		genre: track.genre,
		playCount: track.play_count,
		coverImageUrl: track.cover_image_url,
		createdAt: track.created_at,
		updatedAt: track.updated_at,
	};
}

export const tracksService = {
	/**
	 * Find all tracks with pagination, sorted by created_at descending
	 * Optional filters: genre, artistId, albumId
	 */
	async findAll(
		page: number,
		limit: number,
		genre?: string,
		artistId?: string,
		albumId?: string,
	): Promise<PaginatedTracksResponse> {
		const skip = (page - 1) * limit;

		// Build query filter
		const filter: Record<string, unknown> = {};

		if (genre) {
			// Genre is stored in lowercase, so convert filter to lowercase for case-insensitive matching
			filter["genre"] = genre.toLowerCase();
		}

		if (artistId) {
			filter["artist_id"] = new mongoose.Types.ObjectId(artistId);
		}

		if (albumId) {
			filter["album_id"] = new mongoose.Types.ObjectId(albumId);
		}

		const [tracks, total] = await Promise.all([
			Track.find(filter)
				.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
				.populate<{ album_id: PopulatedAlbum | null }>("album_id", "title cover_image_url")
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(limit)
				.lean<LeanTrackWithPopulated[]>()
				.exec(),
			Track.countDocuments(filter).exec(),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			items: tracks.map((track) => transformTrack(track)),
			total,
			page,
			limit,
			totalPages,
		};
	},

	/**
	 * Find a single track by ID with populated artist and album
	 */
	async findById(id: string): Promise<TrackResponse | null> {
		const track = await Track.findById(id)
			.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
			.populate<{ album_id: PopulatedAlbum | null }>("album_id", "title cover_image_url")
			.lean<LeanTrackWithPopulated | null>()
			.exec();

		if (!track) {
			return null;
		}

		return transformTrack(track);
	},

	/**
	 * Search tracks by title prefix OR exact genre match
	 * Returns max results specified by limit (default 5)
	 */
	async search(query: string, limit = 5): Promise<TrackResponse[]> {
		if (!query || query.trim() === "") {
			return [];
		}

		const trimmedQuery = query.trim();
		const lowercaseQuery = trimmedQuery.toLowerCase();

		// Search by title prefix (case-insensitive) OR exact genre match (lowercase)
		const tracks = await Track.find({
			$or: [
				// Title prefix match (case-insensitive using regex with ^ for prefix)
				{ title: { $regex: `^${escapeRegex(trimmedQuery)}`, $options: "i" } },
				// Exact genre match (genre is stored lowercase)
				{ genre: lowercaseQuery },
			],
		})
			.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
			.populate<{ album_id: PopulatedAlbum | null }>("album_id", "title cover_image_url")
			.limit(limit)
			.lean<LeanTrackWithPopulated[]>()
			.exec();

		return tracks.map((track) => transformTrack(track));
	},

	/**
	 * Increment play count atomically and return the updated track
	 */
	async incrementPlayCount(id: string): Promise<TrackResponse | null> {
		const track = await Track.findByIdAndUpdate(
			id,
			{ $inc: { play_count: 1 } },
			{ new: true },
		)
			.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
			.populate<{ album_id: PopulatedAlbum | null }>("album_id", "title cover_image_url")
			.lean<LeanTrackWithPopulated | null>()
			.exec();

		if (!track) {
			return null;
		}

		return transformTrack(track);
	},
};

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
