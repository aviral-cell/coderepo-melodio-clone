import mongoose from "mongoose";
import { Playlist, IPlaylist } from "./playlist.model.js";
import { Track } from "../tracks/track.model.js";

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

export interface TrackInPlaylistResponse {
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

export interface PlaylistResponse {
	_id: string;
	name: string;
	description?: string;
	ownerId: string;
	trackIds: string[];
	tracks?: TrackInPlaylistResponse[];
	coverImageUrl?: string;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface LeanPlaylist extends IPlaylist {
	_id: mongoose.Types.ObjectId;
}

interface LeanPlaylistWithTracks extends Omit<IPlaylist, "track_ids"> {
	_id: mongoose.Types.ObjectId;
	track_ids: PopulatedTrack[];
}

function transformTrack(track: PopulatedTrack): TrackInPlaylistResponse {
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

function transformPlaylist(playlist: LeanPlaylist): PlaylistResponse {
	return {
		_id: playlist._id.toString(),
		name: playlist.name,
		description: playlist.description,
		ownerId: playlist.owner_id.toString(),
		trackIds: playlist.track_ids.map((id) => id.toString()),
		coverImageUrl: playlist.cover_image_url,
		isPublic: playlist.is_public,
		createdAt: playlist.created_at,
		updatedAt: playlist.updated_at,
	};
}

function transformPlaylistWithTracks(
	playlist: LeanPlaylistWithTracks,
): PlaylistResponse {
	return {
		_id: playlist._id.toString(),
		name: playlist.name,
		description: playlist.description,
		ownerId: playlist.owner_id.toString(),
		trackIds: playlist.track_ids.map((t) => t._id.toString()),
		tracks: playlist.track_ids.map((track) => transformTrack(track)),
		coverImageUrl: playlist.cover_image_url,
		isPublic: playlist.is_public,
		createdAt: playlist.created_at,
		updatedAt: playlist.updated_at,
	};
}

export const playlistsService = {
	async findByOwnerId(ownerId: string): Promise<PlaylistResponse[]> {
		const playlists = await Playlist.find({
			owner_id: new mongoose.Types.ObjectId(ownerId),
		})
			.sort({ updated_at: -1 })
			.lean<LeanPlaylist[]>()
			.exec();

		return playlists.map((playlist) => transformPlaylist(playlist));
	},

	async findById(
		id: string,
		requestingUserId: string,
	): Promise<{ playlist: PlaylistResponse | null; accessDenied: boolean }> {
		const playlist = await Playlist.findById(id)
			.populate<{ track_ids: PopulatedTrack[] }>({
				path: "track_ids",
				populate: [
					{ path: "artist_id", select: "name image_url" },
					{ path: "album_id", select: "title cover_image_url" },
				],
			})
			.lean<LeanPlaylistWithTracks | null>()
			.exec();

		if (!playlist) {
			return { playlist: null, accessDenied: false };
		}

		const isOwner = playlist.owner_id.toString() === requestingUserId;
		if (!isOwner && !playlist.is_public) {
			return { playlist: null, accessDenied: true };
		}

		return {
			playlist: transformPlaylistWithTracks(playlist),
			accessDenied: false,
		};
	},

	async create(
		ownerId: string,
		data: {
			name: string;
			description?: string;
			isPublic?: boolean;
			coverImageUrl?: string;
		},
	): Promise<PlaylistResponse> {
		const playlist = await Playlist.create({
			name: data.name,
			description: data.description,
			owner_id: new mongoose.Types.ObjectId(ownerId),
			track_ids: [],
			cover_image_url: data.coverImageUrl,
			is_public: data.isPublic ?? true,
		});

		const leanPlaylist = playlist.toObject() as LeanPlaylist;
		return transformPlaylist(leanPlaylist);
	},

	async update(
		id: string,
		ownerId: string,
		updates: {
			name?: string;
			description?: string;
			isPublic?: boolean;
			coverImageUrl?: string;
		},
	): Promise<{
		playlist: PlaylistResponse | null;
		notFound: boolean;
		accessDenied: boolean;
	}> {
		const existingPlaylist = await Playlist.findById(id).lean<LeanPlaylist>().exec();

		if (!existingPlaylist) {
			return { playlist: null, notFound: true, accessDenied: false };
		}

		if (existingPlaylist.owner_id.toString() !== ownerId) {
			return { playlist: null, notFound: false, accessDenied: true };
		}

		const updateData: Record<string, unknown> = {};
		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.description !== undefined)
			updateData.description = updates.description;
		if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
		if (updates.coverImageUrl !== undefined)
			updateData.cover_image_url = updates.coverImageUrl;

		const updatedPlaylist = await Playlist.findByIdAndUpdate(id, updateData, {
			new: true,
		})
			.lean<LeanPlaylist>()
			.exec();

		if (!updatedPlaylist) {
			return { playlist: null, notFound: true, accessDenied: false };
		}

		return {
			playlist: transformPlaylist(updatedPlaylist),
			notFound: false,
			accessDenied: false,
		};
	},

	async delete(
		id: string,
		ownerId: string,
	): Promise<{ deleted: boolean; notFound: boolean; accessDenied: boolean }> {
		const existingPlaylist = await Playlist.findById(id).lean<LeanPlaylist>().exec();

		if (!existingPlaylist) {
			return { deleted: false, notFound: true, accessDenied: false };
		}

		if (existingPlaylist.owner_id.toString() !== ownerId) {
			return { deleted: false, notFound: false, accessDenied: true };
		}

		await Playlist.findByIdAndDelete(id).exec();
		return { deleted: true, notFound: false, accessDenied: false };
	},

	async addTrack(
		playlistId: string,
		trackId: string,
		ownerId: string,
	): Promise<{
		playlist: PlaylistResponse | null;
		notFound: boolean;
		accessDenied: boolean;
		trackNotFound: boolean;
	}> {
		const existingPlaylist = await Playlist.findById(playlistId)
			.lean<LeanPlaylist>()
			.exec();

		if (!existingPlaylist) {
			return {
				playlist: null,
				notFound: true,
				accessDenied: false,
				trackNotFound: false,
			};
		}

		if (existingPlaylist.owner_id.toString() !== ownerId) {
			return {
				playlist: null,
				notFound: false,
				accessDenied: true,
				trackNotFound: false,
			};
		}

		const trackObjectId = new mongoose.Types.ObjectId(trackId);
		const track = await Track.findById(trackObjectId).lean().exec();
		if (!track) {
			return {
				playlist: null,
				notFound: false,
				accessDenied: false,
				trackNotFound: true,
			};
		}

		const updatedPlaylist = await Playlist.findByIdAndUpdate(
			playlistId,
			{ $addToSet: { track_ids: trackObjectId } },
			{ new: true },
		)
			.lean<LeanPlaylist>()
			.exec();

		if (!updatedPlaylist) {
			return {
				playlist: null,
				notFound: true,
				accessDenied: false,
				trackNotFound: false,
			};
		}

		return {
			playlist: transformPlaylist(updatedPlaylist),
			notFound: false,
			accessDenied: false,
			trackNotFound: false,
		};
	},

	async removeTrack(
		playlistId: string,
		trackId: string,
		ownerId: string,
	): Promise<{
		playlist: PlaylistResponse | null;
		notFound: boolean;
		accessDenied: boolean;
	}> {
		const existingPlaylist = await Playlist.findById(playlistId)
			.lean<LeanPlaylist>()
			.exec();

		if (!existingPlaylist) {
			return { playlist: null, notFound: true, accessDenied: false };
		}

		if (existingPlaylist.owner_id.toString() !== ownerId) {
			return { playlist: null, notFound: false, accessDenied: true };
		}

		const trackObjectId = new mongoose.Types.ObjectId(trackId);
		const updatedPlaylist = await Playlist.findByIdAndUpdate(
			playlistId,
			{ $pull: { track_ids: trackObjectId } },
			{ new: true },
		)
			.lean<LeanPlaylist>()
			.exec();

		if (!updatedPlaylist) {
			return { playlist: null, notFound: true, accessDenied: false };
		}

		return {
			playlist: transformPlaylist(updatedPlaylist),
			notFound: false,
			accessDenied: false,
		};
	},

	async reorderTracks(
		playlistId: string,
		trackIds: string[],
		ownerId: string,
	): Promise<{
		playlist: PlaylistResponse | null;
		notFound: boolean;
		accessDenied: boolean;
		invalidTrackIds: boolean;
	}> {
		const existingPlaylist = await Playlist.findById(playlistId)
			.lean<LeanPlaylist>()
			.exec();

		if (!existingPlaylist) {
			return {
				playlist: null,
				notFound: true,
				accessDenied: false,
				invalidTrackIds: false,
			};
		}

		if (existingPlaylist.owner_id.toString() !== ownerId) {
			return {
				playlist: null,
				notFound: false,
				accessDenied: true,
				invalidTrackIds: false,
			};
		}

		const currentTrackIds = existingPlaylist.track_ids.map((id) =>
			id.toString(),
		);
		const newTrackIds = [...trackIds].sort();
		const sortedCurrentIds = [...currentTrackIds].sort();

		if (
			newTrackIds.length !== sortedCurrentIds.length ||
			!newTrackIds.every((id, index) => id === sortedCurrentIds[index])
		) {
			return {
				playlist: null,
				notFound: false,
				accessDenied: false,
				invalidTrackIds: true,
			};
		}

		const trackObjectIds = trackIds.map(
			(id) => new mongoose.Types.ObjectId(id),
		);
		const updatedPlaylist = await Playlist.findByIdAndUpdate(
			playlistId,
			{ track_ids: trackObjectIds },
			{ new: true },
		)
			.lean<LeanPlaylist>()
			.exec();

		if (!updatedPlaylist) {
			return {
				playlist: null,
				notFound: true,
				accessDenied: false,
				invalidTrackIds: false,
			};
		}

		return {
			playlist: transformPlaylist(updatedPlaylist),
			notFound: false,
			accessDenied: false,
			invalidTrackIds: false,
		};
	},
};
