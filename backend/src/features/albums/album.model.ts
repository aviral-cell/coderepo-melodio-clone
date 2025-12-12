import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAlbum {
	title: string;
	artist_id: mongoose.Types.ObjectId;
	release_date: Date;
	cover_image_url?: string;
	total_tracks: number;
	created_at: Date;
	updated_at: Date;
}

export interface IAlbumDocument extends IAlbum, Document {
	_id: mongoose.Types.ObjectId;
}

const albumSchema = new Schema<IAlbumDocument>(
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
		release_date: {
			type: Date,
			required: true,
		},
		cover_image_url: {
			type: String,
		},
		total_tracks: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

// Text index on title for full-text search
albumSchema.index({ title: "text" }, { name: "title_text_idx" });

// Ascending index on artist_id for filtering
albumSchema.index({ artist_id: 1 }, { name: "artist_id_asc_idx" });

// Descending index on release_date for sorting
albumSchema.index({ release_date: -1 }, { name: "release_date_desc_idx" });

export const Album: Model<IAlbumDocument> = mongoose.model<IAlbumDocument>(
	"Album",
	albumSchema,
	"albums",
);
