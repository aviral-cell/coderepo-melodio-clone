import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrack {
	title: string;
	artist_id: mongoose.Types.ObjectId;
	album_id: mongoose.Types.ObjectId;
	duration_in_seconds: number;
	track_number: number;
	genre: string;
	play_count: number;
	cover_image_url?: string;
	created_at: Date;
	updated_at: Date;
}

export interface ITrackDocument extends ITrack, Document {
	_id: mongoose.Types.ObjectId;
}

const trackSchema = new Schema<ITrackDocument>(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		artist_id: {
			type: Schema.Types.ObjectId,
			ref: "Artist",
			required: true,
		},
		album_id: {
			type: Schema.Types.ObjectId,
			ref: "Album",
			required: true,
		},
		duration_in_seconds: {
			type: Number,
			required: true,
			min: 1,
		},
		track_number: {
			type: Number,
			required: true,
			min: 1,
		},
		genre: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		play_count: {
			type: Number,
			min: 0,
			default: 0,
		},
		cover_image_url: {
			type: String,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

// Text index on title for search functionality
trackSchema.index({ title: "text" }, { name: "title_text_idx" });

// Ascending index on artist_id for filtering
trackSchema.index({ artist_id: 1 }, { name: "artist_id_asc_idx" });

// Ascending index on album_id for filtering
trackSchema.index({ album_id: 1 }, { name: "album_id_asc_idx" });

// Ascending index on genre for filtering
trackSchema.index({ genre: 1 }, { name: "genre_asc_idx" });

// Descending index on play_count for sorting popular tracks
trackSchema.index({ play_count: -1 }, { name: "play_count_desc_idx" });

export const Track: Model<ITrackDocument> = mongoose.model<ITrackDocument>(
	"Track",
	trackSchema,
	"tracks",
);
