import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConcertTicket {
	user_id: mongoose.Types.ObjectId;
	quantity: number;
	ticket_codes: string[];
	purchased_at: Date;
}

export interface IConcert {
	artist_id: mongoose.Types.ObjectId;
	venue: string;
	city: string;
	date: Date;
	time: string;
	cover_image: string;
	max_tickets_per_user: number;
	tickets: IConcertTicket[];
	created_at: Date;
	updated_at: Date;
}

interface IConcertDocument extends IConcert, Document {
	_id: mongoose.Types.ObjectId;
}

const concertTicketSchema = new Schema<IConcertTicket>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		ticket_codes: {
			type: [String],
			default: [],
		},
		purchased_at: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false },
);

const concertSchema = new Schema<IConcertDocument>(
	{
		artist_id: {
			type: Schema.Types.ObjectId,
			ref: "Artist",
			required: true,
		},
		venue: {
			type: String,
			required: true,
			trim: true,
		},
		city: {
			type: String,
			required: true,
			trim: true,
		},
		date: {
			type: Date,
			required: true,
		},
		time: {
			type: String,
			required: true,
		},
		cover_image: {
			type: String,
		},
		max_tickets_per_user: {
			type: Number,
			default: 6,
		},
		tickets: {
			type: [concertTicketSchema],
			default: [],
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

concertSchema.index({ city: 1 }, { name: "city_asc_idx" });

concertSchema.index({ date: 1 }, { name: "date_asc_idx" });

concertSchema.index({ artist_id: 1 }, { name: "artist_id_asc_idx" });

export const Concert: Model<IConcertDocument> =
	mongoose.model<IConcertDocument>("Concert", concertSchema, "concerts");
