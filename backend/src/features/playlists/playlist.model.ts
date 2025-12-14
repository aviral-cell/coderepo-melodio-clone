import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlaylist {
	name: string;
	description?: string;
	owner_id: mongoose.Types.ObjectId;
	track_ids: mongoose.Types.ObjectId[];
	cover_image_url?: string;
	is_public: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface IPlaylistDocument extends IPlaylist, Document {
	_id: mongoose.Types.ObjectId;
}

const playlistSchema = new Schema<IPlaylistDocument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		owner_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		track_ids: [
			{
				type: Schema.Types.ObjectId,
				ref: "Track",
			},
		],
		cover_image_url: {
			type: String,
		},
		is_public: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

playlistSchema.index({ owner_id: 1 }, { name: "owner_id_asc_idx" });

playlistSchema.index({ updated_at: -1 }, { name: "updated_at_desc_idx" });

export const Playlist: Model<IPlaylistDocument> =
	mongoose.model<IPlaylistDocument>("Playlist", playlistSchema, "playlists");
