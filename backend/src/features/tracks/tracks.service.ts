import mongoose from "mongoose";
import { Track, ITrack } from "./track.model.js";

export interface PopulatedArtist {
	_id: mongoose.Types.ObjectId;
	name: string;
	image_url?: string;
}

export interface PopulatedAlbum {
	_id: mongoose.Types.ObjectId;
	title: string;
	cover_image_url?: string;
}

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
	description: string;
	coverImageUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaginatedTracksResponse {
	items: TrackResponse[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface LeanTrackWithPopulated extends Omit<ITrack, "artist_id" | "album_id"> {
	_id: mongoose.Types.ObjectId;
	artist_id: PopulatedArtist | null;
	album_id: PopulatedAlbum | null;
}

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
		description: track.description,
		coverImageUrl: track.cover_image_url,
		createdAt: track.created_at,
		updatedAt: track.updated_at,
	};
}

export const tracksService = {
	async findAll(
		page: number,
		limit: number,
		genre?: string,
		artistId?: string,
		albumId?: string,
	): Promise<PaginatedTracksResponse> {
		const skip = (page - 1) * limit;

		const filter: Record<string, unknown> = {};

		if (genre) {
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
				.sort({ created_at: 1 })
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

	async search(query: string, limit = 5): Promise<TrackResponse[]> {
		const trimmed = (query || "").trim();
		if (!trimmed) {
			return [];
		}
		const prefixRegex = new RegExp(`^${escapeRegex(trimmed)}`, "i");
		const tracks = await Track.find({ title: prefixRegex })
			.populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
			.populate<{ album_id: PopulatedAlbum | null }>("album_id", "title cover_image_url")
			.limit(limit)
			.lean<LeanTrackWithPopulated[]>()
			.exec();
		return tracks.map((track) => transformTrack(track));
	},

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

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
