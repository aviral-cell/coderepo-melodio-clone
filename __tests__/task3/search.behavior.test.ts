import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";
import { User } from "../../backend/src/features/users/user.model";
import { Artist } from "../../backend/src/features/artists/artist.model";
import { Album } from "../../backend/src/features/albums/album.model";
import { Track } from "../../backend/src/features/tracks/track.model";

const config: Config = loadConfig(true);
const API_BASE = "/api/tracks/search";
const AUTH_BASE = "/api/auth";

let app: Application;
let authToken: string;

const testUser = {
	email: "searchtest@melodio.com",
	username: "searchtestuser",
	password: "Password123!",
	displayName: "Search Test User",
};

async function createTestArtist(name: string, genre: string) {
	return Artist.create({
		name,
		bio: `Bio for ${name}`,
		image_url: `https://www.hackerrank.com/${name.toLowerCase().replace(/\s/g, "-")}.jpg`,
		genres: [genre],
		follower_count: 1000,
	});
}

async function createTestAlbum(
	title: string,
	artistId: mongoose.Types.ObjectId,
) {
	return Album.create({
		title,
		artist_id: artistId,
		release_date: new Date("2023-01-01"),
		cover_image_url: `https://www.hackerrank.com/${title.toLowerCase().replace(/\s/g, "-")}.jpg`,
		total_tracks: 5,
	});
}

async function createTestTrack(
	title: string,
	artistId: mongoose.Types.ObjectId,
	albumId: mongoose.Types.ObjectId,
	genre: string,
	trackNumber = 1,
) {
	return Track.create({
		title,
		artist_id: artistId,
		album_id: albumId,
		duration_in_seconds: 200,
		track_number: trackNumber,
		genre: genre.toLowerCase(),
		play_count: 100,
		cover_image_url: `https://www.hackerrank.com/${title.toLowerCase().replace(/\s/g, "-")}.jpg`,
	});
}

describe("Search Service", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

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

	describe("GET /api/tracks/search", () => {
		it("should search tracks by title prefix with artist and album data", async () => {
			// Seed test artist, album, and tracks
			const artist = await createTestArtist("Thunder Band", "rock");
			const album = await createTestAlbum("Thunder Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");
			await createTestTrack("Thunder Strike", artist._id, album._id, "rock", 2);

			// Search tracks by title prefix
			const res = await request(app)
				.get(`${API_BASE}?q=Thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			// Verify search returns results
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBeGreaterThan(0);

			// Verify response includes populated artist and album data
			const track = res.body.data[0];
			expect(track).toHaveProperty("id");
			expect(track).toHaveProperty("title");
			expect(track).toHaveProperty("artist");
			expect(track.artist).toHaveProperty("id");
			expect(track.artist).toHaveProperty("name");
			expect(track).toHaveProperty("album");
			expect(track.album).toHaveProperty("id");
			expect(track.album).toHaveProperty("title");
		});

		it("should use prefix-based matching (case-insensitive)", async () => {
			// Seed tracks with varied prefixes
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);
			await createTestTrack("Thunder Road", artist._id, album._id, "rock");
			await createTestTrack("Thunder Strike", artist._id, album._id, "rock", 2);
			await createTestTrack("Thunderstorm", artist._id, album._id, "rock", 3);
			await createTestTrack("Lightning Bolt", artist._id, album._id, "rock", 4);

			// Search with lowercase prefix
			const res = await request(app)
				.get(`${API_BASE}?q=thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			// Verify only prefix-matched tracks returned
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.length).toBe(3);

			// Verify correct tracks included and non-matching excluded
			const titles = res.body.data.map((t: { title: string }) => t.title);
			expect(titles).toContain("Thunder Road");
			expect(titles).toContain("Thunder Strike");
			expect(titles).toContain("Thunderstorm");
			expect(titles).not.toContain("Lightning Bolt");
		});

		it("should limit search results to 5 tracks", async () => {
			// Seed 10 tracks with same prefix
			const artist = await createTestArtist("Test Artist", "rock");
			const album = await createTestAlbum("Test Album", artist._id);

			for (let i = 1; i <= 10; i++) {
				await createTestTrack(`Thunder Song ${i}`, artist._id, album._id, "rock", i);
			}

			// Search for all matching tracks
			const res = await request(app)
				.get(`${API_BASE}?q=Thunder`)
				.set("Authorization", `Bearer ${authToken}`);

			// Verify results capped at 5
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.length).toBe(5);
		});
	});
});
