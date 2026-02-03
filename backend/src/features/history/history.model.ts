import mongoose, { Document, Schema } from "mongoose";

export interface IPlayHistory {
	user_id: mongoose.Types.ObjectId;
	track_id: mongoose.Types.ObjectId;
	played_at: Date;
	created_at: Date;
	updated_at: Date;
}

export interface IPlayHistoryDocument extends IPlayHistory, Document {
	_id: mongoose.Types.ObjectId;
}

const playHistorySchema = new Schema<IPlayHistoryDocument>(
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
		played_at: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	},
);

playHistorySchema.index(
	{ user_id: 1, played_at: -1 },
	{ name: "user_id_played_at_desc_idx" },
);

export const PlayHistory = mongoose.model<IPlayHistoryDocument>(
	"PlayHistory",
	playHistorySchema,
	"play_history",
);
