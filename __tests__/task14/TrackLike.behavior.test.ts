/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";

const config: Config = loadConfig(true);

const TRACKS_API_BASE = "/api/tracks";
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

// ========== INLINE SCHEMAS (self-contained) ==========

// --- User Schema ---
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

// --- Artist Schema ---
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

// --- Album Schema ---
interface IAlbum {
	title: string;
	artist_id: mongoose.Types.ObjectId;
	cover_image_url?: string;
	release_date: Date;
	genre: string;
	total_tracks: number;
	created_at: Date;
	updated_at: Date;
}

interface IAlbumDocument extends IAlbum, Document {
	_id: mongoose.Types.ObjectId;
}

const albumSchema = new Schema<IAlbumDocument>(
	{
		title: { type: String, required: true, trim: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
		cover_image_url: { type: String },
		release_date: { type: Date, required: true },
		genre: { type: String, trim: true },
		total_tracks: { type: Number, required: true, min: 1 },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// --- Track Schema ---
interface ITrack {
	title: string;
	artist_id: mongoose.Types.ObjectId;
	album_id: mongoose.Types.ObjectId;
	duration_in_seconds: number;
	genre: string;
	play_count: number;
	track_number: number;
	cover_image_url?: string;
	description: string;
	created_at: Date;
	updated_at: Date;
}

interface ITrackDocument extends ITrack, Document {
	_id: mongoose.Types.ObjectId;
}

const trackSchema = new Schema<ITrackDocument>(
	{
		title: { type: String, required: true, trim: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
		album_id: { type: Schema.Types.ObjectId, ref: "Album", required: true },
		duration_in_seconds: { type: Number, required: true, min: 1 },
		genre: { type: String, required: true, trim: true, lowercase: true },
		play_count: { type: Number, min: 0, default: 0 },
		track_number: { type: Number, required: true, min: 1 },
		cover_image_url: { type: String },
		description: { type: String, required: false, default: "" },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// --- TrackLike Schema ---
interface ITrackLike {
	user_id: mongoose.Types.ObjectId;
	track_id: mongoose.Types.ObjectId;
	type: "like" | "dislike";
	created_at: Date;
	updated_at: Date;
}

interface ITrackLikeDocument extends ITrackLike, Document {
	_id: mongoose.Types.ObjectId;
}

const trackLikeSchema = new Schema<ITrackLikeDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		track_id: { type: Schema.Types.ObjectId, ref: "Track", required: true },
		type: { type: String, enum: ["like", "dislike"], required: true },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

trackLikeSchema.index(
	{ user_id: 1, track_id: 1 },
	{ unique: true, name: "user_id_track_id_unique_idx" },
);

trackLikeSchema.index(
	{ user_id: 1, type: 1, created_at: -1 },
	{ name: "user_id_type_created_at_idx" },
);

// ========== MODEL REGISTRATION ==========

let User: Model<IUserDocument>;
let Artist: Model<IArtistDocument>;
let Album: Model<IAlbumDocument>;
let Track: Model<ITrackDocument>;
let TrackLike: Model<ITrackLikeDocument>;
let app: Application;

// ========== TEST DATA ==========

let testArtist: IArtistDocument;
let testAlbum: IAlbumDocument;
let testTracks: ITrackDocument[];

const testUserData = {
	email: "tracklike-test@hackerrank.com",
	username: "trackliketest",
	password: "Password123!",
	displayName: "Track Like Test User",
};

// ========== HELPER FUNCTIONS ==========

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@hackerrank.com`;
}

async function registerAndLoginUser(
	userData: typeof testUserData,
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

describe("Track Like/Dislike API", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Artist = mongoose.models.Artist || mongoose.model<IArtistDocument>("Artist", artistSchema);
		Album = mongoose.models.Album || mongoose.model<IAlbumDocument>("Album", albumSchema);
		Track = mongoose.models.Track || mongoose.model<ITrackDocument>("Track", trackSchema);
		TrackLike =
			mongoose.models.TrackLike ||
			mongoose.model<ITrackLikeDocument>("TrackLike", trackLikeSchema, "track_likes");

		app = createApp();

		// Seed shared test data (artist, album, tracks)
		testArtist = await Artist.create({
			name: "Like Test Artist",
			genres: ["rock"],
			follower_count: 0,
		});

		testAlbum = await Album.create({
			title: "Like Test Album",
			artist_id: testArtist._id,
			cover_image_url: "/cover.jpg",
			release_date: new Date("2024-01-01"),
			genre: "rock",
			total_tracks: 3,
		});

		testTracks = (await Track.insertMany([
			{
				title: "Track 1",
				artist_id: testArtist._id,
				album_id: testAlbum._id,
				duration_in_seconds: 200,
				genre: "rock",
				track_number: 1,
			},
			{
				title: "Track 2",
				artist_id: testArtist._id,
				album_id: testAlbum._id,
				duration_in_seconds: 180,
				genre: "rock",
				track_number: 2,
			},
			{
				title: "Track 3",
				artist_id: testArtist._id,
				album_id: testAlbum._id,
				duration_in_seconds: 220,
				genre: "rock",
				track_number: 3,
			},
		])) as ITrackDocument[];
	});

	afterAll(async () => {
		await TrackLike.deleteMany({});
		await Track.deleteMany({ _id: { $in: testTracks.map((t) => t._id) } });
		await Album.deleteMany({ _id: testAlbum._id });
		await Artist.deleteMany({ _id: testArtist._id });
		await User.deleteMany({});
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await TrackLike.deleteMany({});
		await User.deleteMany({});
	});

	describe("POST /api/tracks/:id/like", () => {
		describe("Success Cases", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("like-user"),
					username: `likeuser_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should like a track successfully", async () => {
				const trackId = testTracks[0]._id.toString();

				const response = await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBe("like");
				expect(response.body.data.trackId).toBe(trackId);
			});

			it("should switch from dislike to like", async () => {
				const trackId = testTracks[0]._id.toString();

				// First dislike the track
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				// Now like the same track
				const response = await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBe("like");
				expect(response.body.data.trackId).toBe(trackId);

				// Verify the status is updated via the status endpoint
				const statusRes = await request(app)
					.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(statusRes.body.data.status).toBe("like");
			});
		});

		describe("Validation Errors", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("like-validation"),
					username: `likevalid_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should return 404 for non-existent track", async () => {
				const fakeId = new mongoose.Types.ObjectId().toString();

				const response = await request(app)
					.post(`${TRACKS_API_BASE}/${fakeId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(404);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/not found/i);
			});
		});
	});

	describe("POST /api/tracks/:id/dislike", () => {
		describe("Success Cases", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("dislike-user"),
					username: `dislikeuser_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should dislike a track successfully", async () => {
				const trackId = testTracks[1]._id.toString();

				const response = await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBe("dislike");
				expect(response.body.data.trackId).toBe(trackId);
			});

			it("should switch from like to dislike", async () => {
				const trackId = testTracks[1]._id.toString();

				// First like the track
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				// Now dislike the same track
				const response = await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBe("dislike");
				expect(response.body.data.trackId).toBe(trackId);

				// Verify the status is updated via the status endpoint
				const statusRes = await request(app)
					.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(statusRes.body.data.status).toBe("dislike");
			});
		});

		describe("Validation Errors", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("dislike-validation"),
					username: `dislikevalid_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should return 404 for non-existent track", async () => {
				const fakeId = new mongoose.Types.ObjectId().toString();

				const response = await request(app)
					.post(`${TRACKS_API_BASE}/${fakeId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(404);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/not found/i);
			});
		});
	});

	describe("DELETE /api/tracks/:id/like", () => {
		describe("Success Cases", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("remove-user"),
					username: `removeuser_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should remove a like reaction", async () => {
				const trackId = testTracks[0]._id.toString();

				// Like the track first
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				// Remove the reaction
				const response = await request(app)
					.delete(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBeNull();
				expect(response.body.data.trackId).toBe(trackId);

				// Verify status is null after removal
				const statusRes = await request(app)
					.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(statusRes.body.data.status).toBeNull();
			});
		});
	});

	describe("GET /api/tracks/:id/like-status", () => {
		describe("Success Cases", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("status-user"),
					username: `statususer_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should return null status when no reaction exists", async () => {
				const trackId = testTracks[0]._id.toString();

				const response = await request(app)
					.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBeNull();
			});

			it("should return 'like' status after liking a track", async () => {
				const trackId = testTracks[0]._id.toString();

				// Like the track
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				const response = await request(app)
					.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBe("like");
			});

			it("should return 'dislike' status after disliking a track", async () => {
				const trackId = testTracks[1]._id.toString();

				// Dislike the track
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				const response = await request(app)
					.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.status).toBe("dislike");
			});
		});
	});

	describe("GET /api/tracks/liked", () => {
		describe("Success Cases", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("liked-tracks-user"),
					username: `likedtracksuser_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should return paginated liked tracks with populated artist and album", async () => {
				const trackId = testTracks[0]._id.toString();

				// Like a track
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				const response = await request(app)
					.get(`${TRACKS_API_BASE}/liked`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.items).toHaveLength(1);
				expect(response.body.data.total).toBe(1);
				expect(response.body.data.page).toBe(1);
				expect(response.body.data.limit).toBe(10);
				expect(response.body.data.totalPages).toBe(1);

				const likedTrack = response.body.data.items[0];
				expect(likedTrack._id).toBe(trackId);
				expect(likedTrack.title).toBe("Track 1");
				expect(likedTrack.artistId).toBeDefined();
				expect(likedTrack.artistId.name).toBe("Like Test Artist");
				expect(likedTrack.albumId).toBeDefined();
				expect(likedTrack.albumId.title).toBe("Like Test Album");
				expect(likedTrack.likedAt).toBeDefined();
			});

			it("should only return liked tracks, not disliked", async () => {
				// Like track 1
				await request(app)
					.post(`${TRACKS_API_BASE}/${testTracks[0]._id.toString()}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				// Dislike track 2
				await request(app)
					.post(`${TRACKS_API_BASE}/${testTracks[1]._id.toString()}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				// Like track 3
				await request(app)
					.post(`${TRACKS_API_BASE}/${testTracks[2]._id.toString()}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				const response = await request(app)
					.get(`${TRACKS_API_BASE}/liked`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.data.items).toHaveLength(2);
				expect(response.body.data.total).toBe(2);

				const likedTitles = response.body.data.items.map(
					(item: { title: string }) => item.title,
				);
				expect(likedTitles).not.toContain("Track 2");
			});

			it("should respect pagination params", async () => {
				// Like all three tracks
				for (const track of testTracks) {
					await request(app)
						.post(`${TRACKS_API_BASE}/${track._id.toString()}/like`)
						.set("Authorization", `Bearer ${authToken}`);
				}

				// Request page 1 with limit of 2
				const page1Response = await request(app)
					.get(`${TRACKS_API_BASE}/liked`)
					.query({ page: 1, limit: 2 })
					.set("Authorization", `Bearer ${authToken}`);

				expect(page1Response.status).toBe(200);
				expect(page1Response.body.data.items).toHaveLength(2);
				expect(page1Response.body.data.page).toBe(1);
				expect(page1Response.body.data.limit).toBe(2);
				expect(page1Response.body.data.total).toBe(3);
				expect(page1Response.body.data.totalPages).toBe(2);

				// Request page 2 with limit of 2
				const page2Response = await request(app)
					.get(`${TRACKS_API_BASE}/liked`)
					.query({ page: 2, limit: 2 })
					.set("Authorization", `Bearer ${authToken}`);

				expect(page2Response.status).toBe(200);
				expect(page2Response.body.data.items).toHaveLength(1);
				expect(page2Response.body.data.page).toBe(2);
			});
		});
	});

	describe("GET /api/tracks/liked/ids", () => {
		describe("Success Cases", () => {
			let authToken: string;

			beforeEach(async () => {
				const uniqueUser = {
					...testUserData,
					email: generateUniqueEmail("liked-ids-user"),
					username: `likedidsuser_${Date.now()}`,
				};
				const result = await registerAndLoginUser(uniqueUser);
				authToken = result.token;
			});

			it("should return separate liked and disliked arrays", async () => {
				const likedTrackId = testTracks[0]._id.toString();
				const dislikedTrackId = testTracks[1]._id.toString();

				// Like track 1
				await request(app)
					.post(`${TRACKS_API_BASE}/${likedTrackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				// Dislike track 2
				await request(app)
					.post(`${TRACKS_API_BASE}/${dislikedTrackId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				const response = await request(app)
					.get(`${TRACKS_API_BASE}/liked/ids`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.likedIds).toContain(likedTrackId);
				expect(response.body.data.dislikedIds).toContain(dislikedTrackId);
				expect(response.body.data.likedIds).not.toContain(dislikedTrackId);
				expect(response.body.data.dislikedIds).not.toContain(likedTrackId);
			});

			it("should reflect updated state after switching reactions", async () => {
				const trackId = testTracks[0]._id.toString();

				// Like the track
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/like`)
					.set("Authorization", `Bearer ${authToken}`);

				// Verify it appears in likedIds
				let response = await request(app)
					.get(`${TRACKS_API_BASE}/liked/ids`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.body.data.likedIds).toContain(trackId);
				expect(response.body.data.dislikedIds).not.toContain(trackId);

				// Switch to dislike
				await request(app)
					.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
					.set("Authorization", `Bearer ${authToken}`);

				// Verify it moved to dislikedIds
				response = await request(app)
					.get(`${TRACKS_API_BASE}/liked/ids`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.body.data.likedIds).not.toContain(trackId);
				expect(response.body.data.dislikedIds).toContain(trackId);
			});
		});
	});
});
