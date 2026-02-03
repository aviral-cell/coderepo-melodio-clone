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
const PLAYLISTS_BASE = "/api/playlists";
const TRACKS_BASE = "/api/tracks";

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

interface IPlaylist {
	name: string;
	description?: string;
	owner_id: mongoose.Types.ObjectId;
	track_ids: mongoose.Types.ObjectId[];
	cover_image_url?: string;
	is_public: boolean;
	created_at: Date;
	updated_at: Date;
}

interface IPlaylistDocument extends IPlaylist, Document {
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

const playlistSchema = new Schema<IPlaylistDocument>(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, trim: true },
		owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		track_ids: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		cover_image_url: { type: String },
		is_public: { type: Boolean, default: true },
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

let User: Model<IUserDocument>;
let Playlist: Model<IPlaylistDocument>;
let Artist: Model<IArtistDocument>;
let Album: Model<IAlbumDocument>;
let Track: Model<ITrackDocument>;
let app: Application;
let seededTrackIds: string[] = [];

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

async function createPlaylistViaApi(
	token: string,
	playlistData: { name: string; description?: string; isPublic?: boolean },
): Promise<{ playlistId: string; playlist: Record<string, unknown> }> {
	const response = await request(app)
		.post(PLAYLISTS_BASE)
		.set("Authorization", `Bearer ${token}`)
		.send(playlistData);

	return {
		playlistId: response.body.data._id,
		playlist: response.body.data,
	};
}

function getSeededTrackIds(count: number): string[] {
	return seededTrackIds.slice(0, count);
}

async function addTracksToPlaylistAndVerify(
	token: string,
	playlistId: string,
	trackIds: string[],
): Promise<string[]> {
	const addedTrackIds: string[] = [];

	for (const trackId of trackIds) {
		const response = await request(app)
			.post(`${PLAYLISTS_BASE}/${playlistId}/tracks`)
			.set("Authorization", `Bearer ${token}`)
			.send({ trackId });

		if (response.status === 200 && response.body.success) {
			addedTrackIds.push(trackId);
		}
	}

	return addedTrackIds;
}

async function seedTestTracks(): Promise<string[]> {
	const existingTracks = await Track.find().limit(10).lean();
	if (existingTracks.length >= 10) {
		return existingTracks.map((t) => t._id.toString());
	}

	const artist = await Artist.create({
		name: `Test Artist ${Date.now()}`,
		bio: "A test artist for playlist copy tests",
		genres: ["rock", "pop"],
		follower_count: 1000,
	});

	const album = await Album.create({
		title: `Test Album ${Date.now()}`,
		artist_id: artist._id,
		release_date: new Date("2024-01-01"),
		total_tracks: 10,
	});

	const tracks: ITrackDocument[] = [];
	for (let i = 0; i < 10; i += 1) {
		const track = await Track.create({
			title: `Test Track ${i + 1} - ${Date.now()}`,
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

describe("Copy Playlist API", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Playlist = mongoose.models.Playlist || mongoose.model<IPlaylistDocument>("Playlist", playlistSchema);
		Artist = mongoose.models.Artist || mongoose.model<IArtistDocument>("Artist", artistSchema);
		Album = mongoose.models.Album || mongoose.model<IAlbumDocument>("Album", albumSchema);
		Track = mongoose.models.Track || mongoose.model<ITrackDocument>("Track", trackSchema);

		app = createApp();

		seededTrackIds = await seedTestTracks();
	});

	afterAll(async () => {
		await User.deleteMany({ email: { $regex: /hackerrank\.com$/i } });
		await Playlist.deleteMany({});
		await Track.deleteMany({ title: { $regex: /^Test Track/i } });
		await Album.deleteMany({ title: { $regex: /^Test Album/i } });
		await Artist.deleteMany({ name: { $regex: /^Test Artist/i } });
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await User.deleteMany({ email: { $regex: /hackerrank\.com$/i } });
		await Playlist.deleteMany({});
	});

	describe("POST /api/playlists/:id/copy", () => {
		describe("Success Cases", () => {
			it("should copy own playlist successfully with 5 tracks", async () => {
				const userData = {
					email: generateUniqueEmail("copy-own"),
					username: generateUniqueUsername("copyown"),
					password: "Password123!",
					displayName: "Copy Own Playlist User",
				};
				const { token, userId } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(5);
				expect(trackIds).toHaveLength(5);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "My Original Playlist",
					description: "Original description",
					isPublic: true,
				});

				const addedTrackIds = await addTracksToPlaylistAndVerify(token, playlistId, trackIds);
				expect(addedTrackIds).toHaveLength(5);

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toBeDefined();
				expect(response.body.data.name).toBe("Copy of My Original Playlist");
				expect(response.body.data.isPublic).toBe(false);
				expect(response.body.data.ownerId).toBe(userId);
				expect(response.body.data.trackIds).toHaveLength(5);
				expect(response.body.data._id).not.toBe(playlistId);

				expect(response.body.data.trackIds).toEqual(expect.arrayContaining(addedTrackIds));
			});

			it("should copy public playlist from another user successfully", async () => {
				const userAData = {
					email: generateUniqueEmail("user-a-public"),
					username: generateUniqueUsername("userapublic"),
					password: "Password123!",
					displayName: "User A Public",
				};
				const { token: userAToken } = await registerAndLoginUser(userAData);

				const userBData = {
					email: generateUniqueEmail("user-b-public"),
					username: generateUniqueUsername("userbpublic"),
					password: "Password123!",
					displayName: "User B Public",
				};
				const { token: userBToken, userId: userBId } = await registerAndLoginUser(userBData);

				const trackIds = getSeededTrackIds(3);
				expect(trackIds).toHaveLength(3);

				const { playlistId: userAPlaylistId } = await createPlaylistViaApi(userAToken, {
					name: "User A Public Playlist",
					isPublic: true,
				});

				const addedTrackIds = await addTracksToPlaylistAndVerify(userAToken, userAPlaylistId, trackIds);
				expect(addedTrackIds).toHaveLength(3);

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${userAPlaylistId}/copy`)
					.set("Authorization", `Bearer ${userBToken}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data.ownerId).toBe(userBId);
				expect(response.body.data.trackIds).toHaveLength(3);
				expect(response.body.data.name).toBe("Copy of User A Public Playlist");
			});

			it("should copy playlist with custom name when provided", async () => {
				const userData = {
					email: generateUniqueEmail("copy-custom"),
					username: generateUniqueUsername("copycustom"),
					password: "Password123!",
					displayName: "Copy Custom Name User",
				};
				const { token } = await registerAndLoginUser(userData);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "Original Name",
					isPublic: true,
				});

				const customName = "My Custom Playlist Name";
				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({ name: customName });

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data.name).toBe(customName);
			});

			it("should create copied playlist with correct owner who can edit it", async () => {
				const userAData = {
					email: generateUniqueEmail("user-a-owner"),
					username: generateUniqueUsername("useraowner"),
					password: "Password123!",
					displayName: "User A Owner",
				};
				const { token: userAToken } = await registerAndLoginUser(userAData);

				const userBData = {
					email: generateUniqueEmail("user-b-owner"),
					username: generateUniqueUsername("userbowner"),
					password: "Password123!",
					displayName: "User B Owner",
				};
				const { token: userBToken, userId: userBId } = await registerAndLoginUser(userBData);

				const { playlistId: userAPlaylistId } = await createPlaylistViaApi(userAToken, {
					name: "User A Playlist For Owner Test",
					isPublic: true,
				});

				const copyResponse = await request(app)
					.post(`${PLAYLISTS_BASE}/${userAPlaylistId}/copy`)
					.set("Authorization", `Bearer ${userBToken}`)
					.send({});

				expect(copyResponse.status).toBe(201);
				expect(copyResponse.body.data.ownerId).toBe(userBId);

				const copiedPlaylistId = copyResponse.body.data._id;

				const updateResponse = await request(app)
					.patch(`${PLAYLISTS_BASE}/${copiedPlaylistId}`)
					.set("Authorization", `Bearer ${userBToken}`)
					.send({ name: "Updated by new owner" });

				expect(updateResponse.status).toBe(200);
				expect(updateResponse.body.success).toBe(true);
				expect(updateResponse.body.data.name).toBe("Updated by new owner");

				const deleteResponse = await request(app)
					.delete(`${PLAYLISTS_BASE}/${copiedPlaylistId}`)
					.set("Authorization", `Bearer ${userBToken}`);

				expect(deleteResponse.status).toBe(204);
			});
		});

		describe("Authorization Errors", () => {
			it("should return 403 when copying private playlist from another user", async () => {
				const userAData = {
					email: generateUniqueEmail("user-a-private"),
					username: generateUniqueUsername("useraprivate"),
					password: "Password123!",
					displayName: "User A Private",
				};
				const { token: userAToken } = await registerAndLoginUser(userAData);

				const userBData = {
					email: generateUniqueEmail("user-b-private"),
					username: generateUniqueUsername("userbprivate"),
					password: "Password123!",
					displayName: "User B Private",
				};
				const { token: userBToken } = await registerAndLoginUser(userBData);

				const { playlistId: userAPrivatePlaylistId } = await createPlaylistViaApi(userAToken, {
					name: "User A Private Playlist",
					isPublic: false,
				});

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${userAPrivatePlaylistId}/copy`)
					.set("Authorization", `Bearer ${userBToken}`)
					.send({});

				expect(response.status).toBe(403);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/cannot copy private playlist/i);
			});

			it("should return 401 when not authenticated", async () => {
				const userData = {
					email: generateUniqueEmail("unauth-copy"),
					username: generateUniqueUsername("unauthcopy"),
					password: "Password123!",
					displayName: "Unauth Copy User",
				};
				const { token } = await registerAndLoginUser(userData);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "Playlist for Unauth Test",
					isPublic: true,
				});

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.send({});

				expect(response.status).toBe(401);
				expect(response.body.success).toBe(false);
			});
		});

		describe("Not Found Errors", () => {
			it("should return 404 when copying non-existent playlist", async () => {
				const userData = {
					email: generateUniqueEmail("copy-notfound"),
					username: generateUniqueUsername("copynotfound"),
					password: "Password123!",
					displayName: "Copy Not Found User",
				};
				const { token } = await registerAndLoginUser(userData);

				const nonExistentId = new mongoose.Types.ObjectId();

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${nonExistentId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(404);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/playlist not found/i);
			});

			it("should return 400 when playlist ID format is invalid", async () => {
				const userData = {
					email: generateUniqueEmail("copy-invalid-id"),
					username: generateUniqueUsername("copyinvalidid"),
					password: "Password123!",
					displayName: "Copy Invalid ID User",
				};
				const { token } = await registerAndLoginUser(userData);

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/invalid-id-format/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(400);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/invalid.*id/i);
			});
		});

		describe("Edge Cases", () => {
			it("should copy playlist with empty tracks array", async () => {
				const userData = {
					email: generateUniqueEmail("copy-empty"),
					username: generateUniqueUsername("copyempty"),
					password: "Password123!",
					displayName: "Copy Empty Tracks User",
				};
				const { token } = await registerAndLoginUser(userData);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "Empty Playlist",
					isPublic: true,
				});

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data.trackIds).toHaveLength(0);
			});

			it("should copy own private playlist successfully", async () => {
				const userData = {
					email: generateUniqueEmail("copy-own-private"),
					username: generateUniqueUsername("copyownprivate"),
					password: "Password123!",
					displayName: "Copy Own Private User",
				};
				const { token, userId } = await registerAndLoginUser(userData);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "My Private Playlist",
					isPublic: false,
				});

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data.name).toBe("Copy of My Private Playlist");
				expect(response.body.data.ownerId).toBe(userId);
			});

			it("should create a new playlist ID different from original", async () => {
				const userData = {
					email: generateUniqueEmail("copy-diff-id"),
					username: generateUniqueUsername("copydiffid"),
					password: "Password123!",
					displayName: "Copy Different ID User",
				};
				const { token } = await registerAndLoginUser(userData);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "Original for ID Test",
					isPublic: true,
				});

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.data._id).toBeDefined();
				expect(response.body.data._id).not.toBe(playlistId);

				const getResponse = await request(app)
					.get(`${PLAYLISTS_BASE}/${response.body.data._id}`)
					.set("Authorization", `Bearer ${token}`);

				expect(getResponse.status).toBe(200);
				expect(getResponse.body.data._id).not.toBe(playlistId);
			});

			it("should preserve track order when copying playlist", async () => {
				const userData = {
					email: generateUniqueEmail("copy-track-order"),
					username: generateUniqueUsername("copytrackorder"),
					password: "Password123!",
					displayName: "Copy Track Order User",
				};
				const { token } = await registerAndLoginUser(userData);

				const trackIds = getSeededTrackIds(5);
				expect(trackIds).toHaveLength(5);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "Ordered Playlist",
					isPublic: true,
				});

				const addedTrackIds = await addTracksToPlaylistAndVerify(token, playlistId, trackIds);
				expect(addedTrackIds).toHaveLength(5);

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.data.trackIds).toEqual(addedTrackIds);
			});

			it("should set copied playlist as private regardless of original visibility", async () => {
				const userData = {
					email: generateUniqueEmail("copy-always-private"),
					username: generateUniqueUsername("copyalwaysprivate"),
					password: "Password123!",
					displayName: "Copy Always Private User",
				};
				const { token } = await registerAndLoginUser(userData);

				const { playlistId } = await createPlaylistViaApi(token, {
					name: "Public Playlist",
					isPublic: true,
				});

				const response = await request(app)
					.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(response.status).toBe(201);
				expect(response.body.data.isPublic).toBe(false);
			});
		});

		describe("Playlist Limit Enforcement", () => {
			it("should return 403 when free user tries to copy playlist after reaching limit of 7", async () => {
				const anotherUserData = {
					email: generateUniqueEmail("another-limit"),
					username: generateUniqueUsername("anotherlimit"),
					password: "Password123!",
					displayName: "Another Limit User",
				};
				const { token: anotherToken } = await registerAndLoginUser(anotherUserData);

				const { playlistId: publicPlaylistId } = await createPlaylistViaApi(anotherToken, {
					name: "Public Playlist to Copy",
					isPublic: true,
				});

				const userData = {
					email: generateUniqueEmail("limit-copy"),
					username: generateUniqueUsername("limitcopy"),
					password: "Password123!",
					displayName: "Limit Copy User",
				};
				const { token } = await registerAndLoginUser(userData);

				for (let i = 0; i < 7; i += 1) {
					const createRes = await request(app)
						.post(PLAYLISTS_BASE)
						.set("Authorization", `Bearer ${token}`)
						.send({ name: `Playlist ${i + 1}` });
					expect(createRes.status).toBe(201);
				}

				const copyResponse = await request(app)
					.post(`${PLAYLISTS_BASE}/${publicPlaylistId}/copy`)
					.set("Authorization", `Bearer ${token}`)
					.send({});

				expect(copyResponse.status).toBe(403);
				expect(copyResponse.body.success).toBe(false);
				expect(copyResponse.body.error).toMatch(/7 playlists/i);
			});
		});
	});
});
