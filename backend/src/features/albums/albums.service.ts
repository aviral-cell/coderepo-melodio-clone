import mongoose from "mongoose";
import { Album, IAlbum } from "./album.model.js";

export interface PopulatedArtist {
	_id: mongoose.Types.ObjectId;
	name: string;
	image_url?: string;
}

export interface AlbumResponse {
	_id: string;
	title: string;
	artist: {
		_id: string;
		name: string;
		imageUrl?: string;
	};
	releaseDate: Date;
	coverImageUrl?: string;
	totalTracks: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaginatedAlbumsResponse {
	items: AlbumResponse[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface LeanAlbumWithArtist extends Omit<IAlbum, "artist_id"> {
	_id: mongoose.Types.ObjectId;
	artist_id: PopulatedArtist | null;
}

function transformAlbum(album: LeanAlbumWithArtist): AlbumResponse {
	const artist = album.artist_id;

	return {
		_id: album._id.toString(),
		title: album.title,
		artist: {
			_id: artist?._id?.toString() ?? "",
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
	async findAll(
		page: number,
		limit: number,
		artistId?: string,
	): Promise<PaginatedAlbumsResponse> {
		const skip = (page - 1) * limit;

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

	async search(query: string, limit = 5): Promise<AlbumResponse[]> {
		if (!query || query.trim() === "") {
			return [];
		}

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
