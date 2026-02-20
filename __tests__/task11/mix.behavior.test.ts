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

const AUTH_BASE = "/api/auth";
const MIXES_BASE = "/api/mixes";
const TRACKS_BASE = "/api/tracks";

// ========== INTERFACES ==========

enum AccountType {
	PRIMARY = "primary",
	FAMILY_MEMBER = "family_member",
}

enum SubscriptionStatus {
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

interface IUserDocument extends IUser, Document {
	_id: mongoose.Types.ObjectId;
}

interface IArtist {
	name: string;
	bio?: string;
	image_url?: string;
	genres: string[];
	follower_count: number;
	created_at: Date;
	updated_at: Date;
}

interface IArtistDocument extends IArtist, Document {
	_id: mongoose.Types.ObjectId;
}

interface IAlbum {
	title: string;
	artist_id: mongoose.Types.ObjectId;
	release_date: Date;
	cover_image_url?: string;
	total_tracks: number;
	created_at: Date;
	updated_at: Date;
}

interface IAlbumDocument extends IAlbum, Document {
	_id: mongoose.Types.ObjectId;
}

interface ITrack {
	title: string;
	artist_id: mongoose.Types.ObjectId;
	album_id: mongoose.Types.ObjectId;
	duration_in_seconds: number;
	track_number: number;
	genre: string;
	play_count: number;
	cover_image_url?: string;
	created_at: Date;
	updated_at: Date;
}

interface ITrackDocument extends ITrack, Document {
	_id: mongoose.Types.ObjectId;
}

interface IMix {
	user_id: mongoose.Types.ObjectId;
	title: string;
	artist_ids: string[];
	config: {
		variety: string;
		discovery: string;
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

// ========== SCHEMAS ==========

const userSchema = new Schema<IUserDocument>(
	{
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		username: { type: String, required: true, unique: true, trim: true },
		password_hash: { type: String, required: false, select: false },
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
		bio: { type: String, trim: true },
		image_url: { type: String },
		genres: { type: [String], required: true, default: [] },
		follower_count: { type: Number, min: 0, default: 0 },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const albumSchema = new Schema<IAlbumDocument>(
	{
		title: { type: String, required: true, trim: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
		release_date: { type: Date, required: true },
		cover_image_url: { type: String },
		total_tracks: { type: Number, required: true, min: 1 },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const trackSchema = new Schema<ITrackDocument>(
	{
		title: { type: String, required: true, trim: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
		album_id: { type: Schema.Types.ObjectId, ref: "Album", required: true },
		duration_in_seconds: { type: Number, required: true, min: 1 },
		track_number: { type: Number, required: true, min: 1 },
		genre: { type: String, required: true, trim: true, lowercase: true },
		play_count: { type: Number, min: 0, default: 0 },
		cover_image_url: { type: String },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const mixSchema = new Schema<IMixDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		title: { type: String, required: true, trim: true },
		artist_ids: { type: [String], required: true },
		config: {
			variety: { type: String, enum: ["low", "medium", "high"], default: "medium" },
			discovery: { type: String, enum: ["familiar", "blend", "discover"], default: "blend" },
			filters: { type: [String], default: [] },
		},
		track_ids: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		cover_images: { type: [String], default: [] },
		track_count: { type: Number, required: true },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// ========== MODEL REFS ==========

let User: Model<IUserDocument>;
let Artist: Model<IArtistDocument>;
let Album: Model<IAlbumDocument>;
let Track: Model<ITrackDocument>;
let Mix: Model<IMixDocument>;
let app: Application;
let seededTrackIds: string[] = [];

// ========== HELPER FUNCTIONS ==========

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@hackerrank.com`;
}

function generateUniqueUsername(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

async function registerAndLoginUser(userData: {
	email: string;
	username: string;
	password: string;
	displayName: string;
}): Promise<{ token: string; userId: string }> {
	await request(app).post(`${AUTH_BASE}/register`).send(userData);

	const loginRes = await request(app).post(`${AUTH_BASE}/login`).send({
		email: userData.email,
		password: userData.password,
	});

	return {
		token: loginRes.body.data.accessToken,
		userId: loginRes.body.data.user.id,
	};
}

async function seedTestTracks(): Promise<string[]> {
	const existingTracks = await Track.find().limit(10).lean();
	if (existingTracks.length >= 10) {
		return existingTracks.map((t) => t._id.toString());
	}

	const artist = await Artist.create({
		name: `Mix Test Artist ${Date.now()}`,
		bio: "A test artist for mix tests",
		genres: ["rock", "pop"],
		follower_count: 1000,
	});

	const album = await Album.create({
		title: `Mix Test Album ${Date.now()}`,
		artist_id: artist._id,
		release_date: new Date("2024-01-01"),
		total_tracks: 10,
	});

	const tracks: ITrackDocument[] = [];
	for (let i = 0; i < 10; i += 1) {
		const track = await Track.create({
			title: `Mix Test Track ${i + 1} - ${Date.now()}`,
			artist_id: artist._id,
			album_id: album._id,
			duration_in_seconds: 180 + i * 10,
			track_number: i + 1,
			genre: "rock",
			play_count: i * 100,
		});
		tracks.push(track);
	}

	return tracks.map((t) => t._id.toString());
}

function getSeededTrackIds(count: number): string[] {
	return seededTrackIds.slice(0, count);
}

function buildMixBody(trackIds: string[], overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		title: "The Amplifiers and Neon Dreams mix",
		artistIds: ["artist-id-1", "artist-id-2"],
		config: {
			variety: "medium",
			discovery: "blend",
			filters: ["Popular", "Upbeat"],
		},
		trackIds,
		coverImages: ["/images/artists/artist1.jpg", "/images/artists/artist2.jpg"],
		...overrides,
	};
}

// ========== TEST SUITE ==========

describe("Mix API", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Artist = mongoose.models.Artist || mongoose.model<IArtistDocument>("Artist", artistSchema);
		Album = mongoose.models.Album || mongoose.model<IAlbumDocument>("Album", albumSchema);
		Track = mongoose.models.Track || mongoose.model<ITrackDocument>("Track", trackSchema);
		Mix = mongoose.models.Mix || mongoose.model<IMixDocument>("Mix", mixSchema, "mixes");

		app = createApp();

		seededTrackIds = await seedTestTracks();
	});

	afterAll(async () => {
		await User.deleteMany({ email: { $regex: /hackerrank\.com$/i } });
		await Mix.deleteMany({});
		await Track.deleteMany({ title: { $regex: /^Mix Test Track/i } });
		await Album.deleteMany({ title: { $regex: /^Mix Test Album/i } });
		await Artist.deleteMany({ name: { $regex: /^Mix Test Artist/i } });
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await User.deleteMany({ email: { $regex: /hackerrank\.com$/i } });
		await Mix.deleteMany({});
	});

	describe("POST /api/mixes", () => {
		describe("Success Cases", () => {
			it("should create a mix and return 201 with saved mix data", async () => {
				const userData = {
					email: generateUniqueEmail("mix-create"),
					username: generateUniqueUsername("mixcreate"),
					password: "Password123!",
					displayName: "Mix Create User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(5);
				expect(trackIds.length).toBeGreaterThanOrEqual(5);

				const body = buildMixBody(trackIds);

				const response = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body);

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toBeDefined();
				expect(response.body.data._id).toBeDefined();
				expect(response.body.data.title).toBe("The Amplifiers and Neon Dreams mix");
				expect(response.body.data.trackCount).toBe(5);
				expect(response.body.data.artistIds).toHaveLength(2);
				expect(response.body.data.config).toBeDefined();
				expect(response.body.data.config.variety).toBe("medium");
				expect(response.body.data.config.discovery).toBe("blend");
				expect(response.body.data.config.filters).toEqual(["Popular", "Upbeat"]);
				expect(response.body.data.coverImages).toHaveLength(2);
				expect(response.body.data.trackIds).toHaveLength(5);
			});
		});

		describe("Validation Errors", () => {
			it("should return 400 when artistIds is empty", async () => {
				const userData = {
					email: generateUniqueEmail("mix-no-artists"),
					username: generateUniqueUsername("mixnoartists"),
					password: "Password123!",
					displayName: "Mix No Artists User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(3);
				const body = buildMixBody(trackIds, { artistIds: [] });

				const response = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body);

				expect(response.status).toBe(400);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/artist/i);
			});

			it("should return 400 when trackIds is empty", async () => {
				const userData = {
					email: generateUniqueEmail("mix-no-tracks"),
					username: generateUniqueUsername("mixnotracks"),
					password: "Password123!",
					displayName: "Mix No Tracks User",
				};
				const { token } = await registerAndLoginUser(userData);

				const body = buildMixBody([], { trackIds: [] });

				const response = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body);

				expect(response.status).toBe(400);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/track/i);
			});

			it("should return 400 when title is missing", async () => {
				const userData = {
					email: generateUniqueEmail("mix-no-title"),
					username: generateUniqueUsername("mixnotitle"),
					password: "Password123!",
					displayName: "Mix No Title User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(3);
				const body = buildMixBody(trackIds, { title: "" });

				const response = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body);

				expect(response.status).toBe(400);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/title/i);
			});
		});
	});

	describe("GET /api/mixes", () => {
		describe("Success Cases", () => {
			it("should return only the authenticated user's mixes", async () => {
				const userData = {
					email: generateUniqueEmail("mix-list"),
					username: generateUniqueUsername("mixlist"),
					password: "Password123!",
					displayName: "Mix List User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(3);

				const body1 = buildMixBody(trackIds, { title: "First Mix" });
				const body2 = buildMixBody(trackIds, { title: "Second Mix" });

				await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body1);

				await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body2);

				const response = await request(app)
					.get(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toHaveLength(2);

				const titles = response.body.data.map((m: { title: string }) => m.title);
				expect(titles).toContain("First Mix");
				expect(titles).toContain("Second Mix");

				response.body.data.forEach((mix: { title: string; trackCount: number }) => {
					expect(mix.title).toBeDefined();
					expect(mix.trackCount).toBe(3);
				});
			});

			it("should not return mixes belonging to another user", async () => {
				const userAData = {
					email: generateUniqueEmail("mix-user-a"),
					username: generateUniqueUsername("mixusera"),
					password: "Password123!",
					displayName: "Mix User A",
				};
				const { token: tokenA } = await registerAndLoginUser(userAData);

				const userBData = {
					email: generateUniqueEmail("mix-user-b"),
					username: generateUniqueUsername("mixuserb"),
					password: "Password123!",
					displayName: "Mix User B",
				};
				const { token: tokenB } = await registerAndLoginUser(userBData);

				const trackIds = getSeededTrackIds(3);

				await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${tokenA}`)
					.send(buildMixBody(trackIds, { title: "User A Mix" }));

				const response = await request(app)
					.get(MIXES_BASE)
					.set("Authorization", `Bearer ${tokenB}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toHaveLength(0);
			});
		});
	});

	describe("GET /api/mixes/:id", () => {
		describe("Success Cases", () => {
			it("should return mix by ID with populated tracks", async () => {
				const userData = {
					email: generateUniqueEmail("mix-getbyid"),
					username: generateUniqueUsername("mixgetbyid"),
					password: "Password123!",
					displayName: "Mix GetById User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(3);
				const body = buildMixBody(trackIds, { title: "Populated Mix" });

				const createRes = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body);

				expect(createRes.status).toBe(201);
				const mixId = createRes.body.data._id;

				const response = await request(app)
					.get(`${MIXES_BASE}/${mixId}`)
					.set("Authorization", `Bearer ${token}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data._id).toBe(mixId);
				expect(response.body.data.title).toBe("Populated Mix");

				expect(response.body.data.tracks).toBeDefined();
				expect(response.body.data.tracks).toHaveLength(3);

				const firstTrack = response.body.data.tracks[0];
				expect(firstTrack).toHaveProperty("id");
				expect(firstTrack).toHaveProperty("title");
				expect(firstTrack).toHaveProperty("durationInSeconds");
				expect(firstTrack).toHaveProperty("artist");
				expect(firstTrack.artist).toHaveProperty("id");
				expect(firstTrack.artist).toHaveProperty("name");
				expect(firstTrack).toHaveProperty("album");
				expect(firstTrack.album).toHaveProperty("id");
				expect(firstTrack.album).toHaveProperty("title");
			});
		});

		describe("Not Found Errors", () => {
			it("should return 404 for a non-existent mix ID", async () => {
				const userData = {
					email: generateUniqueEmail("mix-notfound"),
					username: generateUniqueUsername("mixnotfound"),
					password: "Password123!",
					displayName: "Mix Not Found User",
				};
				const { token } = await registerAndLoginUser(userData);

				const nonExistentId = new mongoose.Types.ObjectId();

				const response = await request(app)
					.get(`${MIXES_BASE}/${nonExistentId}`)
					.set("Authorization", `Bearer ${token}`);

				expect(response.status).toBe(404);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/not found/i);
			});
		});

		describe("Validation Errors", () => {
			it("should return 400 for an invalid mix ID format", async () => {
				const userData = {
					email: generateUniqueEmail("mix-invalidid"),
					username: generateUniqueUsername("mixinvalidid"),
					password: "Password123!",
					displayName: "Mix Invalid ID User",
				};
				const { token } = await registerAndLoginUser(userData);

				const response = await request(app)
					.get(`${MIXES_BASE}/invalid-id-format`)
					.set("Authorization", `Bearer ${token}`);

				expect(response.status).toBe(400);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/invalid/i);
			});
		});
	});

	describe("DELETE /api/mixes/:id", () => {
		describe("Success Cases", () => {
			it("should delete a mix and return 204", async () => {
				const userData = {
					email: generateUniqueEmail("mix-delete"),
					username: generateUniqueUsername("mixdelete"),
					password: "Password123!",
					displayName: "Mix Delete User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(3);
				const body = buildMixBody(trackIds, { title: "Mix to Delete" });

				const createRes = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${token}`)
					.send(body);

				expect(createRes.status).toBe(201);
				const mixId = createRes.body.data._id;

				const deleteRes = await request(app)
					.delete(`${MIXES_BASE}/${mixId}`)
					.set("Authorization", `Bearer ${token}`);

				expect(deleteRes.status).toBe(204);

				const getRes = await request(app)
					.get(`${MIXES_BASE}/${mixId}`)
					.set("Authorization", `Bearer ${token}`);

				expect(getRes.status).toBe(404);
				expect(getRes.body.success).toBe(false);
			});
		});

		describe("Not Found Errors", () => {
			it("should return 404 when deleting a non-existent mix", async () => {
				const userData = {
					email: generateUniqueEmail("mix-delete-notfound"),
					username: generateUniqueUsername("mixdeletenotfound"),
					password: "Password123!",
					displayName: "Mix Delete Not Found User",
				};
				const { token } = await registerAndLoginUser(userData);

				const nonExistentId = new mongoose.Types.ObjectId();

				const response = await request(app)
					.delete(`${MIXES_BASE}/${nonExistentId}`)
					.set("Authorization", `Bearer ${token}`);

				expect(response.status).toBe(404);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/not found/i);
			});
		});

		describe("Ownership Verification", () => {
			it("should return 404 when deleting another user's mix", async () => {
				const userAData = {
					email: generateUniqueEmail("mix-owner-a"),
					username: generateUniqueUsername("mixownera"),
					password: "Password123!",
					displayName: "Mix Owner A",
				};
				const { token: tokenA } = await registerAndLoginUser(userAData);

				const userBData = {
					email: generateUniqueEmail("mix-owner-b"),
					username: generateUniqueUsername("mixownerb"),
					password: "Password123!",
					displayName: "Mix Owner B",
				};
				const { token: tokenB } = await registerAndLoginUser(userBData);

				const trackIds = getSeededTrackIds(3);
				const body = buildMixBody(trackIds, { title: "User A Mix" });

				const createRes = await request(app)
					.post(MIXES_BASE)
					.set("Authorization", `Bearer ${tokenA}`)
					.send(body);

				expect(createRes.status).toBe(201);
				const mixId = createRes.body.data._id;

				const deleteRes = await request(app)
					.delete(`${MIXES_BASE}/${mixId}`)
					.set("Authorization", `Bearer ${tokenB}`);

				expect(deleteRes.status).toBe(404);
				expect(deleteRes.body.success).toBe(false);
			});
		});
	});

	describe("Authentication", () => {
		it("should return 401 when calling POST /api/mixes without a token", async () => {
			const trackIds = getSeededTrackIds(3);
			const body = buildMixBody(trackIds);

			const response = await request(app)
				.post(MIXES_BASE)
				.send(body);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should return 401 when calling GET /api/mixes without a token", async () => {
			const response = await request(app)
				.get(MIXES_BASE);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should return 401 when calling GET /api/mixes/:id without a token", async () => {
			const fakeId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.get(`${MIXES_BASE}/${fakeId}`);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should return 401 when calling DELETE /api/mixes/:id without a token", async () => {
			const fakeId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.delete(`${MIXES_BASE}/${fakeId}`);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should return 401 when using an invalid token", async () => {
			const response = await request(app)
				.get(MIXES_BASE)
				.set("Authorization", "Bearer invalid-jwt-token-string");

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});
});
