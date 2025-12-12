/**
 * @jest-environment node
 */

/**
 * INTRO: Search Service Integration Tests (HackerRank Task 3 - Backend)
 *
 * Tests the search endpoint: GET /api/search?q=query
 * Uses real MongoDB test database for integration testing.
 * These tests follow TDD approach - written BEFORE implementation.
 *
 * SCENARIO: Search returns TRACKS ONLY (no artists, albums)
 * - Prefix-based matching on track title
 * - Case-insensitive search
 * - Maximum 5 results returned
 * - Empty query returns empty results
 * - Requires authentication
 *
 * EXPECTATION:
 * - Response format: { success: true, data: { tracks: [...] } }
 * - Each track has: id, title, artist, album, durationInSeconds, etc.
 * - Artist and album are populated with minimal fields
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose, { Schema, Document } from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";

const config: Config = loadConfig(true);
const API_BASE = "/api/search";
const AUTH_BASE = "/api/auth";

interface IUser {
	email: string;
	username: string;
	password_hash: string;
	display_name: string;
	avatar_url?: string;
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
		password_hash: { type: String, required: true },
		display_name: { type: String, required: true, trim: true },
		avatar_url: { type: String },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

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

const artistSchema = new Schema<IArtistDocument>(
	{
		name: { type: String, required: true, trim: true },
		bio: { type: String, trim: true },
		image_url: { type: String },
		genres: { type: [String], required: true, default: [] },
		follower_count: { type: Number, default: 0, min: 0 },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

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

const trackSchema = new Schema<ITrackDocument>(
	{
		title: { type: String, required: true, trim: true },
		artist_id: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
		album_id: { type: Schema.Types.ObjectId, ref: "Album", required: true },
		duration_in_seconds: { type: Number, required: true, min: 1 },
		track_number: { type: Number, required: true, min: 1 },
		genre: { type: String, required: true, trim: true, lowercase: true },
		play_count: { type: Number, default: 0, min: 0 },
		cover_image_url: { type: String },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

let User: mongoose.Model<IUserDocument>;
let Artist: mongoose.Model<IArtistDocument>;
let Album: mongoose.Model<IAlbumDocument>;
let Track: mongoose.Model<ITrackDocument>;
let app: Application;
let authToken: string;

const testUser = {
	email: "searchtest@example.com",
	username: "searchtestuser",
	password: "Password123!",
	displayName: "Search Test User",
};

async function createTestArtist(name: string, genre: string): Promise<IArtistDocument> {
	return Artist.create({
		name,
		bio: `Bio for ${name}`,
		image_url: `https://example.com/${name.toLowerCase().replace(/\s/g, "-")}.jpg`,
		genres: [genre],
		follower_count: 1000,
	});
}

async function createTestAlbum(
	title: string,
	artistId: mongoose.Types.ObjectId,
): Promise<IAlbumDocument> {
	return Album.create({
		title,
		artist_id: artistId,
		release_date: new Date("2023-01-01"),
		cover_image_url: `https://example.com/${title.toLowerCase().replace(/\s/g, "-")}.jpg`,
		total_tracks: 5,
	});
}

async function createTestTrack(
	title: string,
	artistId: mongoose.Types.ObjectId,
	albumId: mongoose.Types.ObjectId,
	genre: string,
	trackNumber = 1,
): Promise<ITrackDocument> {
	return Track.create({
		title,
		artist_id: artistId,
		album_id: albumId,
		duration_in_seconds: 200,
		track_number: trackNumber,
		genre: genre.toLowerCase(),
		play_count: 100,
		cover_image_url: `https://example.com/${title.toLowerCase().replace(/\s/g, "-")}.jpg`,
	});
}

describe("Search Service", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Artist = mongoose.models.Artist || mongoose.model<IArtistDocument>("Artist", artistSchema);
		Album = mongoose.models.Album || mongoose.model<IAlbumDocument>("Album", albumSchema);
		Track = mongoose.models.Track || mongoose.model<ITrackDocument>("Track", trackSchema);

		app = createApp();

		await User.deleteMany({});
		await Artist.deleteMany({});
		await Album.deleteMany({});
		await Track.deleteMany({});

		await request(app).post(`${AUTH_BASE}/register`).send(testUser);

		const loginRes = await request(app).post(`${AUTH_BASE}/login`).send({
			email: testUser.email,
			password: testUser.password,
		});
		authToken = loginRes.body.data.accessToken;
	});

	afterAll(async () => {
		await User.deleteMany({});
		await Artist.deleteMany({});
		await Album.deleteMany({});
		await Track.deleteMany({});
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await Artist.deleteMany({});
		await Album.deleteMany({});
		await Track.deleteMany({});
	});

	describe("GET /api/search (Track Search)", () => {
		it("should return tracks only (no artists or albums in response)", async () => {
			const artist = await createTestArtist("Thunder Band", "rock");
			const album = await createTestAlbum("Thunder Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");
			await createTestTrack("Thunder Strike", artist._id, album._id, "rock", 2);

			const res = await request(app)
				.get(`${API_BASE}?q=Thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty("tracks");
			expect(Array.isArray(res.body.data.tracks)).toBe(true);
			expect(res.body.data.tracks.length).toBeGreaterThan(0);
			expect(res.body.data).not.toHaveProperty("artists");
			expect(res.body.data).not.toHaveProperty("albums");
		});

		it("should use prefix-based matching (case-insensitive)", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");
			await createTestTrack("Thunder Strike", artist._id, album._id, "rock", 2);
			await createTestTrack("Thunderstorm", artist._id, album._id, "rock", 3);
			await createTestTrack("Lightning Bolt", artist._id, album._id, "rock", 4);

			const res = await request(app)
				.get(`${API_BASE}?q=thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks.length).toBe(3);

			const titles = res.body.data.tracks.map((t: { title: string }) => t.title);
			expect(titles).toContain("Thunder Road");
			expect(titles).toContain("Thunder Strike");
			expect(titles).toContain("Thunderstorm");
			expect(titles).not.toContain("Lightning Bolt");
		});

		it("should limit results to maximum 5 tracks", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);

			for (let i = 1; i <= 10; i++) {
				await createTestTrack(`Thunder Song ${i}`, artist._id, album._id, "rock", i);
			}

			const res = await request(app)
				.get(`${API_BASE}?q=Thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks.length).toBe(5);
		});

		it("should return empty tracks array for empty query", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");

			const res = await request(app)
				.get(`${API_BASE}?q=`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks).toEqual([]);
		});

		it("should return empty tracks array for whitespace-only query", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");

			const res = await request(app)
				.get(`${API_BASE}?q=   `)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks).toEqual([]);
		});

		it("should return empty tracks array when no matches found", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");

			const res = await request(app)
				.get(`${API_BASE}?q=NonExistentQuery`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks).toEqual([]);
		});

		it("should return 401 Unauthorized without token", async () => {
			const res = await request(app).get(`${API_BASE}?q=Thunder`);

			expect(res.status).toBe(401);
		});

		it("should return 401 Unauthorized with invalid token", async () => {
			const res = await request(app)
				.get(`${API_BASE}?q=Thunder`)
				.set("Authorization", "Bearer invalid-token");

			expect(res.status).toBe(401);
		});

		it("should return tracks with populated artist and album info", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");

			const res = await request(app)
				.get(`${API_BASE}?q=Thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks.length).toBe(1);

			const track = res.body.data.tracks[0];
			expect(track).toHaveProperty("id");
			expect(track).toHaveProperty("title", "Thunder Road");
			expect(track).toHaveProperty("artist");
			expect(track.artist).toHaveProperty("id");
			expect(track.artist).toHaveProperty("name", "Test Artist");
			expect(track).toHaveProperty("album");
			expect(track.album).toHaveProperty("id");
			expect(track.album).toHaveProperty("title", "Test Album");
			expect(track).toHaveProperty("durationInSeconds");
			expect(track).toHaveProperty("genre", "rock");
		});

		it("should handle special characters in search query", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Rock & Roll", artist._id, album._id, "rock");

			const res = await request(app)
				.get(`${API_BASE}?q=Rock%20%26`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("should search without q parameter and return empty results", async () => {
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");

			const res = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.tracks).toEqual([]);
		});
	});
});
