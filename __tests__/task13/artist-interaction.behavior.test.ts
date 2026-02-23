/**
 * @jest-environment node
 */
// @ts-nocheck

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";

const config: Config = loadConfig(true);

const ARTIST_API_BASE = "/api/artists";
const AUTH_API_BASE = "/api/auth";

// ========== INLINE ENUMS ==========

enum AccountType {
	PRIMARY = "primary",
	FAMILY_MEMBER = "family_member",
}

enum SubscriptionStatus {
	FREE = "free",
	PREMIUM = "premium",
}

// ========== INLINE INTERFACES ==========

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

interface IUserDocument extends IUser, Document {
	_id: mongoose.Types.ObjectId;
}

interface IArtist {
	name: string;
	image_url?: string;
	bio?: string;
	genres: string[];
	follower_count: number;
	created_at: Date;
	updated_at: Date;
}

interface IArtistDocument extends IArtist, Document {
	_id: mongoose.Types.ObjectId;
}

interface IArtistFollow {
	user_id: mongoose.Types.ObjectId;
	artist_id: mongoose.Types.ObjectId;
	created_at: Date;
	updated_at: Date;
}

interface IArtistFollowDocument extends IArtistFollow, Document {
	_id: mongoose.Types.ObjectId;
}

interface IArtistRating {
	user_id: mongoose.Types.ObjectId;
	artist_id: mongoose.Types.ObjectId;
	rating: number;
	created_at: Date;
	updated_at: Date;
}

interface IArtistRatingDocument extends IArtistRating, Document {
	_id: mongoose.Types.ObjectId;
}

// ========== INLINE SCHEMAS ==========

const userSchema = new Schema<IUserDocument>(
	{
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		username: { type: String, required: true, unique: true, trim: true },
		password_hash: {
			type: String,
			required: function (this: IUserDocument) {
				return this.account_type === AccountType.PRIMARY;
			},
		},
		display_name: { type: String, required: true, trim: true },
		avatar_url: { type: String },
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
		is_active: { type: Boolean, default: true },
		subscription_status: {
			type: String,
			enum: Object.values(SubscriptionStatus),
			default: SubscriptionStatus.FREE,
		},
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const artistSchema = new Schema<IArtistDocument>(
	{
		name: { type: String, required: true, trim: true },
		image_url: { type: String },
		bio: { type: String, trim: true },
		genres: { type: [String], required: true, default: [] },
		follower_count: { type: Number, min: 0, default: 0 },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const artistFollowSchema = new Schema<IArtistFollowDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

artistFollowSchema.index({ user_id: 1, artist_id: 1 }, { unique: true, name: "user_artist_unique_idx" });

const artistRatingSchema = new Schema<IArtistRatingDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
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
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

artistRatingSchema.index({ user_id: 1, artist_id: 1 }, { unique: true, name: "user_artist_rating_unique_idx" });

// ========== MODEL REFERENCES ==========

let User: Model<IUserDocument>;
let Artist: Model<IArtistDocument>;
let ArtistFollow: Model<IArtistFollowDocument>;
let ArtistRating: Model<IArtistRatingDocument>;
let app: Application;

// ========== TEST DATA ==========

let testArtist: IArtistDocument;

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@hackerrank.com`;
}

async function registerAndLoginUser(
	userData: { email: string; username: string; password: string; displayName: string },
): Promise<{ token: string; userId: string }> {
	await request(app).post(`${AUTH_API_BASE}/register`).send(userData);

	const loginRes = await request(app).post(`${AUTH_API_BASE}/login`).send({
		email: userData.email,
		password: userData.password,
	});

	return {
		token: loginRes.body.data.accessToken,
		userId: loginRes.body.data.user.id,
	};
}

// ========== TEST SUITE ==========

describe("Artist Interaction API", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Artist = mongoose.models.Artist || mongoose.model<IArtistDocument>("Artist", artistSchema);
		ArtistFollow =
			mongoose.models.ArtistFollow ||
			mongoose.model<IArtistFollowDocument>("ArtistFollow", artistFollowSchema);
		ArtistRating =
			mongoose.models.ArtistRating ||
			mongoose.model<IArtistRatingDocument>("ArtistRating", artistRatingSchema);

		app = createApp();

		testArtist = await Artist.create({
			name: "Test Artist for Interactions",
			image_url: "/test-artist.jpg",
			bio: "Test bio",
			genres: ["rock"],
			follower_count: 0,
		});
	});

	afterAll(async () => {
		await ArtistRating.deleteMany({});
		await ArtistFollow.deleteMany({});
		await Artist.deleteMany({});
		await User.deleteMany({});
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await ArtistFollow.deleteMany({});
		await ArtistRating.deleteMany({});
		await Artist.findByIdAndUpdate(testArtist._id, { $set: { follower_count: 0 } });
	});

	describe("POST /api/artists/:id/follow", () => {
		let authToken: string;

		beforeEach(async () => {
			const testUserData = {
				email: generateUniqueEmail("artist-follow"),
				username: `artistfollow_${Date.now()}`,
				password: "Password123!",
				displayName: "Follow Test User",
			};
			const result = await registerAndLoginUser(testUserData);
			authToken = result.token;
		});

		it("should follow an artist successfully", async () => {
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isFollowing).toBe(true);
			expect(response.body.data.followerCount).toBe(1);
		});

		it("should unfollow when called again (toggle)", async () => {
			// First call: follow
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
				.set("Authorization", `Bearer ${authToken}`);

			// Second call: unfollow
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isFollowing).toBe(false);
			expect(response.body.data.followerCount).toBe(0);
		});

		it("should increment and decrement follower_count on artist", async () => {
			// Follow
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
				.set("Authorization", `Bearer ${authToken}`);

			const artistAfterFollow = await Artist.findById(testArtist._id);
			expect(artistAfterFollow?.follower_count).toBe(1);

			// Unfollow
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
				.set("Authorization", `Bearer ${authToken}`);

			const artistAfterUnfollow = await Artist.findById(testArtist._id);
			expect(artistAfterUnfollow?.follower_count).toBe(0);
		});

		it("should return 401 without auth token", async () => {
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	describe("POST /api/artists/:id/rate", () => {
		let authToken: string;
		let authUserId: string;

		beforeEach(async () => {
			const testUserData = {
				email: generateUniqueEmail("artist-rate"),
				username: `artistrate_${Date.now()}`,
				password: "Password123!",
				displayName: "Rate Test User",
			};
			const result = await registerAndLoginUser(testUserData);
			authToken = result.token;
			authUserId = result.userId;
		});

		it("should rate an artist with a valid rating", async () => {
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 4 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userRating).toBe(4);
			expect(response.body.data.averageRating).toBe(4);
			expect(response.body.data.totalRatings).toBe(1);
		});

		it("should update existing rating when called again", async () => {
			// First rating
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 3 });

			// Update rating
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 4.5 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userRating).toBe(4.5);
			expect(response.body.data.averageRating).toBe(4.5);
			expect(response.body.data.totalRatings).toBe(1);
		});

		it("should compute correct average with multiple users", async () => {
			// First user rates 4
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 4 });

			// Register and login a second user
			const secondUserData = {
				email: generateUniqueEmail("artist-rate-second"),
				username: `artistrate2_${Date.now()}`,
				password: "Password123!",
				displayName: "Second Rate User",
			};
			const { token: secondToken } = await registerAndLoginUser(secondUserData);

			// Second user rates 2
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${secondToken}`)
				.send({ rating: 2 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userRating).toBe(2);
			expect(response.body.data.averageRating).toBe(3);
			expect(response.body.data.totalRatings).toBe(2);
		});

		it("should reject invalid rating below minimum (0)", async () => {
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 0 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/rating/i);
		});

		it("should reject invalid rating above maximum (6)", async () => {
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 6 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/rating/i);
		});

		it("should reject non-0.5-increment rating (3.3)", async () => {
			const response = await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 3.3 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/rating/i);
		});
	});

	describe("GET /api/artists/:id/interaction", () => {
		let authToken: string;

		beforeEach(async () => {
			const testUserData = {
				email: generateUniqueEmail("artist-interact"),
				username: `artistinteract_${Date.now()}`,
				password: "Password123!",
				displayName: "Artist Interaction Test User",
			};
			const result = await registerAndLoginUser(testUserData);
			authToken = result.token;
		});

		it("should return default state for new user (not following, no rating)", async () => {
			const response = await request(app)
				.get(`${ARTIST_API_BASE}/${testArtist._id}/interaction`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isFollowing).toBe(false);
			expect(response.body.data.userRating).toBe(0);
			expect(response.body.data.averageRating).toBe(0);
			expect(response.body.data.totalRatings).toBe(0);
		});

		it("should reflect follow status after following", async () => {
			// Follow the artist
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
				.set("Authorization", `Bearer ${authToken}`);

			// Check interaction
			const response = await request(app)
				.get(`${ARTIST_API_BASE}/${testArtist._id}/interaction`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isFollowing).toBe(true);
		});

		it("should reflect rating after rating", async () => {
			// Rate the artist
			await request(app)
				.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ rating: 3.5 });

			// Check interaction
			const response = await request(app)
				.get(`${ARTIST_API_BASE}/${testArtist._id}/interaction`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userRating).toBe(3.5);
			expect(response.body.data.averageRating).toBe(3.5);
			expect(response.body.data.totalRatings).toBe(1);
		});

		it("should return 401 without auth token", async () => {
			const response = await request(app)
				.get(`${ARTIST_API_BASE}/${testArtist._id}/interaction`);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});
});
