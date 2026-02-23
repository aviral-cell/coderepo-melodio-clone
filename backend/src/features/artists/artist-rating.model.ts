import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArtistRating {
	user_id: mongoose.Types.ObjectId;
	artist_id: mongoose.Types.ObjectId;
	rating: number;
	created_at: Date;
	updated_at: Date;
}

export interface IArtistRatingDocument extends IArtistRating, Document {
	_id: mongoose.Types.ObjectId;
}

const artistRatingSchema = new Schema<IArtistRatingDocument>(
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
		rating: {
			type: Number,
			required: true,
			min: 0.5,
			max: 5,
			validate: {
				validator: (v: number) => (v * 2) % 1 === 0,
				message: "Rating must be in 0.5 increments",
			},
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

artistRatingSchema.index(
	{ user_id: 1, artist_id: 1 },
	{ unique: true, name: "user_artist_rating_unique_idx" },
);

artistRatingSchema.index(
	{ artist_id: 1, created_at: -1 },
	{ name: "artist_created_at_desc_idx" },
);

export const ArtistRating: Model<IArtistRatingDocument> = mongoose.model<IArtistRatingDocument>(
	"ArtistRating",
	artistRatingSchema,
	"artist_ratings",
);
