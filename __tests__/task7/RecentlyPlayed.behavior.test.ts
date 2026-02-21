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

const HISTORY_API_BASE = "/api/history";
const AUTH_API_BASE = "/api/auth";
const TRACKS_API_BASE = "/api/tracks";

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

interface IPlayHistory {
	user_id: mongoose.Types.ObjectId;
	track_id: mongoose.Types.ObjectId;
	played_at: Date;
	created_at: Date;
	updated_at: Date;
}

interface IPlayHistoryDocument extends IPlayHistory, Document {
	_id: mongoose.Types.ObjectId;
}

interface TrackApiResponse {
	id: string;
	title: string;
	artist: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	album: {
		id: string;
		title: string;
		coverImageUrl?: string;
	};
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
}

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

const playHistorySchema = new Schema<IPlayHistoryDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		track_id: { type: Schema.Types.ObjectId, ref: "Track", required: true },
		played_at: { type: Date, default: Date.now },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

let User: Model<IUserDocument>;
let Artist: Model<IArtistDocument>;
let Album: Model<IAlbumDocument>;
let Track: Model<ITrackDocument>;
let PlayHistory: Model<IPlayHistoryDocument>;
let app: Application;
let seededTrackIds: string[] = [];

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

async function seedTestTracks(): Promise<string[]> {
	const existingTracks = await Track.find().limit(60).lean();
	if (existingTracks.length >= 60) {
		return existingTracks.map((t) => t._id.toString());
	}

	const artist = await Artist.create({
		name: `History Test Artist ${Date.now()}`,
		bio: "A test artist for history tests",
		genres: ["rock", "pop"],
		follower_count: 1000,
	});

	const album = await Album.create({
		title: `History Test Album ${Date.now()}`,
		artist_id: artist._id,
		release_date: new Date("2024-01-01"),
		total_tracks: 60,
	});

	const tracks: ITrackDocument[] = [];
	for (let i = 0; i < 60; i += 1) {
		const track = await Track.create({
			title: `History Test Track ${i + 1} - ${Date.now()}`,
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

async function getTracksFromApi(token: string, limit: number = 50): Promise<TrackApiResponse[]> {
	const response = await request(app)
		.get(TRACKS_API_BASE)
		.query({ limit })
		.set("Authorization", `Bearer ${token}`);

	if (!response.body.data || !response.body.data.items) {
		return [];
	}

	return response.body.data.items;
}

async function recordPlayViaApi(token: string, trackId: string): Promise<request.Response> {
	return request(app)
		.post(`${HISTORY_API_BASE}/play`)
		.set("Authorization", `Bearer ${token}`)
		.send({ trackId });
}

async function recordPlaysInOrder(
	token: string,
	trackIds: string[],
	delayMs: number = 10,
): Promise<void> {
	for (const trackId of trackIds) {
		await recordPlayViaApi(token, trackId);
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
}

describe("Recently Played History API", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Artist = mongoose.models.Artist || mongoose.model<IArtistDocument>("Artist", artistSchema);
		Album = mongoose.models.Album || mongoose.model<IAlbumDocument>("Album", albumSchema);
		Track = mongoose.models.Track || mongoose.model<ITrackDocument>("Track", trackSchema);
		PlayHistory = mongoose.models.PlayHistory || mongoose.model<IPlayHistoryDocument>("PlayHistory", playHistorySchema, "play_history");

		app = createApp();

		seededTrackIds = await seedTestTracks();
	});

	afterAll(async () => {
		await User.deleteMany({ email: { $regex: /hackerrank\.com$/i } });
		await PlayHistory.deleteMany({});
		await Track.deleteMany({ title: { $regex: /^History Test Track/i } });
		await Album.deleteMany({ title: { $regex: /^History Test Album/i } });
		await Artist.deleteMany({ name: { $regex: /^History Test Artist/i } });
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await User.deleteMany({ email: { $regex: /hackerrank\.com$/i } });
		await PlayHistory.deleteMany({});
	});

	describe("POST /api/history/play", () => {
		describe("Success Cases", () => {
			let authToken: string;
			let userId: string;
			let testTracks: TrackApiResponse[];

			beforeEach(async () => {
				const userData = {
					email: generateUniqueEmail("history-test"),
					username: `historytest_${Date.now()}`,
					password: "Password123!",
					displayName: "History Test User",
				};
				const result = await registerAndLoginUser(userData);
				authToken = result.token;
				userId = result.userId;

				testTracks = await getTracksFromApi(authToken, 10);
			});

			it("should create play history entry in database after recording play", async () => {
				await recordPlayViaApi(authToken, testTracks[0].id);

				const historyResponse = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(historyResponse.body.data.tracks).toHaveLength(1);
				expect(historyResponse.body.data.tracks[0].id).toBe(testTracks[0].id);
			});

			it("should allow recording same track multiple times", async () => {
				await recordPlayViaApi(authToken, testTracks[0].id);

				const response = await recordPlayViaApi(authToken, testTracks[0].id);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);

				const historyResponse = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(historyResponse.body.data.tracks).toHaveLength(2);
			});
		});

		describe("Validation Errors", () => {
			let authToken: string;

			beforeEach(async () => {
				const userData = {
					email: generateUniqueEmail("validation-test"),
					username: `validationtest_${Date.now()}`,
					password: "Password123!",
					displayName: "Validation Test User",
				};
				const result = await registerAndLoginUser(userData);
				authToken = result.token;
			});

			it("should return 404 when track does not exist", async () => {
				const nonExistentTrackId = new mongoose.Types.ObjectId();

				const response = await request(app)
					.post(`${HISTORY_API_BASE}/play`)
					.set("Authorization", `Bearer ${authToken}`)
					.send({ trackId: nonExistentTrackId.toString() });

				expect(response.status).toBe(404);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/track not found/i);
			});
		});
	});

	describe("GET /api/history/recently-played", () => {
		describe("Success Cases", () => {
			let authToken: string;
			let userId: string;
			let testTracks: TrackApiResponse[];

			beforeEach(async () => {
				const userData = {
					email: generateUniqueEmail("get-history-test"),
					username: `gethistorytest_${Date.now()}`,
					password: "Password123!",
					displayName: "Get History Test User",
				};
				const result = await registerAndLoginUser(userData);
				authToken = result.token;
				userId = result.userId;

				testTracks = await getTracksFromApi(authToken, 10);
			});

			it("should return recently played tracks with correct structure", async () => {
				const tracksToPlay = testTracks.slice(0, 5);
				await recordPlaysInOrder(authToken, tracksToPlay.map((t) => t.id));

				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.tracks).toHaveLength(5);
				expect(response.body.data.total).toBe(5);

				const firstTrack = response.body.data.tracks[0];
				expect(firstTrack).toHaveProperty("id");
				expect(firstTrack).toHaveProperty("title");
				expect(firstTrack).toHaveProperty("durationInSeconds");
				expect(firstTrack).toHaveProperty("playedAt");
				expect(firstTrack).toHaveProperty("artist");
				expect(firstTrack.artist).toHaveProperty("id");
				expect(firstTrack.artist).toHaveProperty("name");
				expect(firstTrack).toHaveProperty("album");
				expect(firstTrack.album).toHaveProperty("id");
				expect(firstTrack.album).toHaveProperty("title");
			});

			it("should return tracks sorted by most recent first", async () => {
				const tracksToPlay = testTracks.slice(0, 3);
				await recordPlaysInOrder(authToken, tracksToPlay.map((t) => t.id), 50);

				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data.tracks).toHaveLength(3);

				expect(response.body.data.tracks[0].id).toBe(tracksToPlay[2].id);
				expect(response.body.data.tracks[1].id).toBe(tracksToPlay[1].id);
				expect(response.body.data.tracks[2].id).toBe(tracksToPlay[0].id);
			});

			it("should populate artist and album data correctly", async () => {
				await recordPlayViaApi(authToken, testTracks[0].id);

				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.data.tracks).toHaveLength(1);

				const returnedTrack = response.body.data.tracks[0];
				expect(returnedTrack.artist.name).toBeDefined();
				expect(returnedTrack.artist.name.length).toBeGreaterThan(0);
				expect(returnedTrack.album.title).toBeDefined();
				expect(returnedTrack.album.title.length).toBeGreaterThan(0);
			});
		});

		describe("Pagination & Limits", () => {
			let authToken: string;
			let userId: string;
			let testTracks: TrackApiResponse[];

			beforeEach(async () => {
				const userData = {
					email: generateUniqueEmail("pagination-test"),
					username: `paginationtest_${Date.now()}`,
					password: "Password123!",
					displayName: "Pagination Test User",
				};
				const result = await registerAndLoginUser(userData);
				authToken = result.token;
				userId = result.userId;

				testTracks = await getTracksFromApi(authToken, 50);
			});

			it("should respect custom limit parameter", async () => {
				const tracksToPlay = testTracks.slice(0, 30);
				for (const track of tracksToPlay) {
					await recordPlayViaApi(authToken, track.id);
				}

				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.query({ limit: 10 })
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.data.tracks).toHaveLength(10);
				expect(response.body.data.total).toBe(30);
			});

			it("should use default limit when not specified", async () => {
				const tracksToPlay = testTracks.slice(0, 25);
				for (const track of tracksToPlay) {
					await recordPlayViaApi(authToken, track.id);
				}

				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.data.tracks).toHaveLength(20);
				expect(response.body.data.total).toBe(25);
			});
		});
	});

	describe("DELETE /api/history/recently-played", () => {
		describe("Success Cases", () => {
			let authToken: string;
			let userId: string;
			let testTracks: TrackApiResponse[];

			beforeEach(async () => {
				const userData = {
					email: generateUniqueEmail("clear-history-test"),
					username: `clearhistorytest_${Date.now()}`,
					password: "Password123!",
					displayName: "Clear History Test User",
				};
				const result = await registerAndLoginUser(userData);
				authToken = result.token;
				userId = result.userId;

				testTracks = await getTracksFromApi(authToken, 20);
			});

			it("should clear all user history and return success message", async () => {
				const tracksToPlay = testTracks.slice(0, 10);
				for (const track of tracksToPlay) {
					await recordPlayViaApi(authToken, track.id);
				}

				const historyBefore = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);
				expect(historyBefore.body.data.total).toBe(10);

				const response = await request(app)
					.delete(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.message).toMatch(/history cleared/i);

				const getResponse = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				expect(getResponse.body.data.tracks).toHaveLength(0);
				expect(getResponse.body.data.total).toBe(0);
			});

			it("should not affect other users history when clearing", async () => {
				const userAData = {
					email: generateUniqueEmail("user-a"),
					username: `usera_${Date.now()}`,
					password: "Password123!",
					displayName: "User A",
				};
				const userA = await registerAndLoginUser(userAData);

				const userBData = {
					email: generateUniqueEmail("user-b"),
					username: `userb_${Date.now()}`,
					password: "Password123!",
					displayName: "User B",
				};
				const userB = await registerAndLoginUser(userBData);

				for (let i = 0; i < 10; i++) {
					await recordPlayViaApi(userA.token, testTracks[i % testTracks.length].id);
				}

				for (let i = 0; i < 5; i++) {
					await recordPlayViaApi(userB.token, testTracks[(i + 10) % testTracks.length].id);
				}

				await request(app)
					.delete(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${userA.token}`);

				const userAHistory = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${userA.token}`);

				expect(userAHistory.body.data.tracks).toHaveLength(0);

				const userBHistory = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${userB.token}`);

				expect(userBHistory.body.data.tracks).toHaveLength(5);
			});
		});
	});

	describe("History Limit Enforcement (FIFO)", () => {
		describe("Maximum Capacity", () => {
			let authToken: string;
			let userId: string;
			let trackIds: string[];

			beforeEach(async () => {
				const userData = {
					email: generateUniqueEmail("fifo-test"),
					username: `fifotest_${Date.now()}`,
					password: "Password123!",
					displayName: "FIFO Test User",
				};
				const result = await registerAndLoginUser(userData);
				authToken = result.token;
				userId = result.userId;

				trackIds = getSeededTrackIds(60);
			});

			it("should maintain maximum of 50 tracks using FIFO when adding new track", async () => {
				for (let i = 0; i < 50; i++) {
					await recordPlayViaApi(authToken, trackIds[i]);
				}

				const historyBefore = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.query({ limit: 50 })
					.set("Authorization", `Bearer ${authToken}`);

				expect(historyBefore.body.data.total).toBe(50);

				const oldestTrackId = historyBefore.body.data.tracks[historyBefore.body.data.tracks.length - 1].id;

				await recordPlayViaApi(authToken, trackIds[50]);

				const historyAfter = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.query({ limit: 50 })
					.set("Authorization", `Bearer ${authToken}`);

				expect(historyAfter.body.data.total).toBe(50);

				expect(historyAfter.body.data.tracks[0].id).toBe(trackIds[50]);

				const allIds = historyAfter.body.data.tracks.map((t: { id: string }) => t.id);
				expect(allIds).not.toContain(oldestTrackId);
			}, 15000);

			it("should remove oldest track when history exceeds 50", async () => {
				for (let i = 0; i < 50; i++) {
					await recordPlayViaApi(authToken, trackIds[i]);
				}

				const historyBefore = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.query({ limit: 50 })
					.set("Authorization", `Bearer ${authToken}`);

				const oldestTrackId = historyBefore.body.data.tracks[historyBefore.body.data.tracks.length - 1].id;

				await recordPlayViaApi(authToken, trackIds[51]);

				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.query({ limit: 50 })
					.set("Authorization", `Bearer ${authToken}`);

				expect(response.body.data.tracks[0].id).toBe(trackIds[51]);

				const allIds = response.body.data.tracks.map((t: { id: string }) => t.id);
				expect(allIds).not.toContain(oldestTrackId);
			}, 15000);
		});
	});

	describe("User Isolation", () => {
		describe("Cross-User Data Separation", () => {
			it("should isolate play history between different users", async () => {
				const userData1 = {
					email: generateUniqueEmail("user-isolation-1"),
					username: `userisolation1_${Date.now()}`,
					password: "Password123!",
					displayName: "Isolation User 1",
				};
				const user1 = await registerAndLoginUser(userData1);

				const userData2 = {
					email: generateUniqueEmail("user-isolation-2"),
					username: `userisolation2_${Date.now()}`,
					password: "Password123!",
					displayName: "Isolation User 2",
				};
				const user2 = await registerAndLoginUser(userData2);

				const tracks = await getTracksFromApi(user1.token, 10);

				await recordPlayViaApi(user1.token, tracks[0].id);
				await recordPlayViaApi(user2.token, tracks[1].id);

				const user1History = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${user1.token}`);

				expect(user1History.body.data.tracks).toHaveLength(1);
				expect(user1History.body.data.tracks[0].id).toBe(tracks[0].id);

				const user2History = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${user2.token}`);

				expect(user2History.body.data.tracks).toHaveLength(1);
				expect(user2History.body.data.tracks[0].id).toBe(tracks[1].id);
			});
		});
	});
});
