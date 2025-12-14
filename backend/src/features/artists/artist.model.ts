import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArtist {
	name: string;
	bio?: string;
	image_url?: string;
	genres: string[];
	follower_count: number;
	created_at: Date;
	updated_at: Date;
}

export interface IArtistDocument extends IArtist, Document {
	_id: mongoose.Types.ObjectId;
}

const artistSchema = new Schema<IArtistDocument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		bio: {
			type: String,
			trim: true,
		},
		image_url: {
			type: String,
		},
		genres: {
			type: [String],
			required: true,
			default: [],
		},
		follower_count: {
			type: Number,
			min: 0,
			default: 0,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

artistSchema.index({ name: "text" }, { name: "name_text_idx" });

artistSchema.index({ follower_count: -1 }, { name: "follower_count_desc_idx" });

export const Artist: Model<IArtistDocument> = mongoose.model<IArtistDocument>(
	"Artist",
	artistSchema,
	"artists",
);
