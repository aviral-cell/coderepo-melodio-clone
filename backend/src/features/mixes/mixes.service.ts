import mongoose from "mongoose";
import { Mix, IMix } from "./mix.model.js";

export class MixError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.name = "MixError";
	}
}

interface PopulatedArtist {
	_id: mongoose.Types.ObjectId;
	name: string;
	image_url?: string;
}

interface PopulatedAlbum {
	_id: mongoose.Types.ObjectId;
	title: string;
	cover_image_url?: string;
}

interface PopulatedTrack {
	_id: mongoose.Types.ObjectId;
	title: string;
	artist_id: PopulatedArtist | null;
	album_id: PopulatedAlbum | null;
	duration_in_seconds: number;
	track_number: number;
	genre: string;
	play_count: number;
	cover_image_url?: string;
	created_at: Date;
	updated_at: Date;
}

export interface TrackInMixResponse {
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

export interface MixResponse {
	_id: string;
	userId: string;
	title: string;
	artistIds: string[];
	config: {
		variety: string;
		discovery: string;
		filters: string[];
	};
	trackIds: string[];
	tracks?: TrackInMixResponse[];
	coverImages: string[];
	trackCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateMixInput {
	title: string;
	artistIds: string[];
	config?: {
		variety?: "low" | "medium" | "high";
		discovery?: "familiar" | "blend" | "discover";
		filters?: string[];
	};
	trackIds: string[];
	coverImages?: string[];
}

interface LeanMix extends IMix {
	_id: mongoose.Types.ObjectId;
}

interface LeanMixWithTracks extends Omit<IMix, "track_ids"> {
	_id: mongoose.Types.ObjectId;
	track_ids: PopulatedTrack[];
}

function transformTrack(track: PopulatedTrack): TrackInMixResponse {
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

function transformMix(mix: LeanMix): MixResponse {
	return {
		_id: mix._id.toString(),
		userId: mix.user_id.toString(),
		title: mix.title,
		artistIds: mix.artist_ids,
		config: {
			variety: mix.config.variety,
			discovery: mix.config.discovery,
			filters: mix.config.filters,
		},
		trackIds: mix.track_ids.map((id) => id.toString()),
		coverImages: mix.cover_images,
		trackCount: mix.track_count,
		createdAt: mix.created_at,
		updatedAt: mix.updated_at,
	};
}

function transformMixWithTracks(mix: LeanMixWithTracks): MixResponse {
	return {
		_id: mix._id.toString(),
		userId: mix.user_id.toString(),
		title: mix.title,
		artistIds: mix.artist_ids,
		config: {
			variety: mix.config.variety,
			discovery: mix.config.discovery,
			filters: mix.config.filters,
		},
		trackIds: mix.track_ids.map((t) => t._id.toString()),
		tracks: mix.track_ids.map((track) => transformTrack(track)),
		coverImages: mix.cover_images,
		trackCount: mix.track_count,
		createdAt: mix.created_at,
		updatedAt: mix.updated_at,
	};
}

export const mixesService = {
	async createMix(
		userId: string,
		body: CreateMixInput,
	): Promise<MixResponse> {
		const trackObjectIds = body.trackIds.map(
			(id) => new mongoose.Types.ObjectId(id),
		);

		const mix = await Mix.create({
			user_id: new mongoose.Types.ObjectId(userId),
			title: body.title,
			artist_ids: body.artistIds,
			config: {
				variety: body.config?.variety ?? "medium",
				discovery: body.config?.discovery ?? "blend",
				filters: body.config?.filters ?? [],
			},
			track_ids: trackObjectIds,
			cover_images: body.coverImages ?? [],
			track_count: body.trackIds.length,
		});

		const leanMix = mix.toObject() as LeanMix;
		return transformMix(leanMix);
	},

	async getUserMixes(userId: string): Promise<MixResponse[]> {
		const mixes = await Mix.find({
			user_id: new mongoose.Types.ObjectId(userId),
		})
			.sort({ created_at: -1 })
			.lean<LeanMix[]>()
			.exec();

		return mixes.map((mix) => transformMix(mix));
	},

	async getMixById(
		userId: string,
		mixId: string,
	): Promise<MixResponse> {
		const mix = await Mix.findById(mixId)
			.populate<{ track_ids: PopulatedTrack[] }>({
				path: "track_ids",
				populate: [
					{ path: "artist_id", select: "name image_url" },
					{ path: "album_id", select: "title cover_image_url" },
				],
			})
			.lean<LeanMixWithTracks | null>()
			.exec();

		if (!mix) {
			throw new MixError("Mix not found", 404);
		}

		if (mix.user_id.toString() !== userId) {
			throw new MixError("Mix not found", 404);
		}

		return transformMixWithTracks(mix);
	},

	async renameMix(
		userId: string,
		mixId: string,
		title: string,
	): Promise<MixResponse> {
		const mix = await Mix.findById(mixId).lean<LeanMix | null>().exec();

		if (!mix) {
			throw new MixError("Mix not found", 404);
		}

		if (mix.user_id.toString() !== userId) {
			throw new MixError("Mix not found", 404);
		}

		const updated = await Mix.findByIdAndUpdate(
			mixId,
			{ title },
			{ new: true },
		)
			.lean<LeanMix | null>()
			.exec();

		return transformMix(updated!);
	},

	async deleteMix(userId: string, mixId: string): Promise<void> {
		const mix = await Mix.findById(mixId).lean<LeanMix | null>().exec();

		if (!mix) {
			throw new MixError("Mix not found", 404);
		}

		if (mix.user_id.toString() !== userId) {
			throw new MixError("Mix not found", 404);
		}

		await Mix.findByIdAndDelete(mixId).exec();
	},
};
