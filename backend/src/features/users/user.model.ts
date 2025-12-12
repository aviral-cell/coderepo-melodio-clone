import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser {
	email: string;
	username: string;
	password_hash: string;
	display_name: string;
	avatar_url?: string;
	created_at: Date;
	updated_at: Date;
}

export interface IUserDocument extends IUser, Document {
	_id: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
	{
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
		},
		password_hash: {
			type: String,
			required: true,
			select: false,
		},
		display_name: {
			type: String,
			required: true,
			trim: true,
		},
		avatar_url: {
			type: String,
			default: undefined,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

userSchema.index({ email: 1 }, { unique: true, name: "email_unique_idx" });
userSchema.index({ username: 1 }, { unique: true, name: "username_unique_idx" });

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", userSchema, "users");
