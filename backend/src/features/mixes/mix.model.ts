import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMix {
	user_id: mongoose.Types.ObjectId;
	title: string;
	artist_ids: string[];
	config: {
		variety: "low" | "medium" | "high";
		discovery: "familiar" | "blend" | "discover";
		filters: string[];
	};
	track_ids: mongoose.Types.ObjectId[];
	cover_images: string[];
	track_count: number;
	created_at: Date;
	updated_at: Date;
}

interface IMixDocument extends IMix, Document {
	_id: mongoose.Types.ObjectId;
}

const mixSchema = new Schema<IMixDocument>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		artist_ids: {
			type: [String],
			required: true,
		},
		config: {
			variety: {
				type: String,
				enum: ["low", "medium", "high"],
				default: "medium",
			},
			discovery: {
				type: String,
				enum: ["familiar", "blend", "discover"],
				default: "blend",
			},
			filters: {
				type: [String],
				default: [],
			},
		},
		track_ids: [
			{
				type: Schema.Types.ObjectId,
				ref: "Track",
			},
		],
		cover_images: {
			type: [String],
			default: [],
		},
		track_count: {
			type: Number,
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

mixSchema.index({ user_id: 1 }, { name: "user_id_asc_idx" });

mixSchema.index({ created_at: -1 }, { name: "created_at_desc_idx" });

export const Mix: Model<IMixDocument> = mongoose.model<IMixDocument>(
	"Mix",
	mixSchema,
	"mixes",
);
