import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrackLike {
	user_id: mongoose.Types.ObjectId;
	track_id: mongoose.Types.ObjectId;
	type: "like" | "dislike";
	created_at: Date;
	updated_at: Date;
}

export interface ITrackLikeDocument extends ITrackLike, Document {
	_id: mongoose.Types.ObjectId;
}

const trackLikeSchema = new Schema<ITrackLikeDocument>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		track_id: {
			type: Schema.Types.ObjectId,
			ref: "Track",
			required: true,
		},
		type: {
			type: String,
			enum: ["like", "dislike"],
			required: true,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

trackLikeSchema.index(
	{ user_id: 1, track_id: 1 },
	{ unique: true, name: "user_id_track_id_unique_idx" },
);

trackLikeSchema.index(
	{ user_id: 1, type: 1, created_at: -1 },
	{ name: "user_id_type_created_at_idx" },
);

export const TrackLike: Model<ITrackLikeDocument> = mongoose.model<ITrackLikeDocument>(
	"TrackLike",
	trackLikeSchema,
	"track_likes",
);
