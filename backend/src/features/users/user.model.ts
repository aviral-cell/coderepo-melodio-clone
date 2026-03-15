import mongoose, { Schema, Document, Model } from "mongoose";

export enum AccountType {
	PRIMARY = "primary",
	FAMILY_MEMBER = "family_member",
}

export enum SubscriptionStatus {
	FREE = "free",
	PREMIUM = "premium",
}

interface IUser {
	email: string;
	username: string;
	password_hash: string;
	display_name: string;
	avatar_url?: string;
	account_type: AccountType;
	primary_account_id: mongoose.Types.ObjectId | null;
	is_active: boolean;
	subscription_status: SubscriptionStatus;
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
			required: function (this: IUserDocument) {
				return this.account_type === AccountType.PRIMARY;
			},
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
		account_type: {
			type: String,
			enum: Object.values(AccountType),
			default: AccountType.PRIMARY,
		},
		primary_account_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		is_active: {
			type: Boolean,
			default: true,
		},
		subscription_status: {
			type: String,
			enum: Object.values(SubscriptionStatus),
			default: SubscriptionStatus.FREE,
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
userSchema.index({ primary_account_id: 1 }, { name: "primary_account_id_asc_idx" });

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", userSchema, "users");
