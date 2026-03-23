import mongoose, { Schema, Document, Model } from "mongoose";

interface IArtistFollow {
	user_id: mongoose.Types.ObjectId;
	artist_id: mongoose.Types.ObjectId;
	created_at: Date;
	updated_at: Date;
}

interface IArtistFollowDocument extends IArtistFollow, Document {
	_id: mongoose.Types.ObjectId;
}

const artistFollowSchema = new Schema<IArtistFollowDocument>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		artist_id: {
			type: Schema.Types.ObjectId,
			ref: "Artist",
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

artistFollowSchema.index(
	{ user_id: 1, artist_id: 1 },
	{ unique: true, name: "user_artist_unique_idx" },
);

export const ArtistFollow: Model<IArtistFollowDocument> = mongoose.model<IArtistFollowDocument>(
	"ArtistFollow",
	artistFollowSchema,
	"artist_follows",
);
