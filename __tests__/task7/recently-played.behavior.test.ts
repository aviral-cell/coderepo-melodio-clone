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
import { Track, ITrackDocument } from "../../backend/src/features/tracks/track.model";
import { PlayHistory } from "../../backend/src/features/history/history.model";

const config: Config = loadConfig(true);

const HISTORY_API_BASE = "/api/history";
const AUTH_API_BASE = "/api/auth";
const TRACKS_API_BASE = "/api/tracks";

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

let app: Application;
let seededTrackIds: string[] = [];

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@melodio.com`;
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

describe("Recently Played History", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

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

	describe("Recording Track Plays", () => {
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

		it("should record track in play history", async () => {
			// Record a track play
			await recordPlayViaApi(authToken, testTracks[0].id);

			// Fetch recently played history
			const historyResponse = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);

			// Verify track appears in history
			expect(historyResponse.body.data.tracks).toHaveLength(1);
			expect(historyResponse.body.data.tracks[0].id).toBe(testTracks[0].id);
		});

		it("should allow recording same track multiple times", async () => {
			// Record first play
			await recordPlayViaApi(authToken, testTracks[0].id);

			// Record same track again
			const response = await recordPlayViaApi(authToken, testTracks[0].id);

			// Verify second play accepted
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			// Verify both plays in history
			const historyResponse = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(historyResponse.body.data.tracks).toHaveLength(2);
		});

	});

	describe("Retrieving Play History", () => {
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
			// Record 5 track plays
			const tracksToPlay = testTracks.slice(0, 5);
			await recordPlaysInOrder(authToken, tracksToPlay.map((t) => t.id));

			// Fetch recently played
			const response = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);

			// Verify track fields include artist and album data
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
			expect(firstTrack.artist.name).toBeDefined();
			expect(firstTrack.artist.name.length).toBeGreaterThan(0);
			expect(firstTrack.album.title).toBeDefined();
			expect(firstTrack.album.title.length).toBeGreaterThan(0);
		});

		it("should return tracks sorted by most recent first", async () => {
			// Record 3 tracks in order with delay
			const tracksToPlay = testTracks.slice(0, 3);
			await recordPlaysInOrder(authToken, tracksToPlay.map((t) => t.id), 50);

			// Fetch recently played
			const response = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.tracks).toHaveLength(3);

			// Verify reverse chronological order
			expect(response.body.data.tracks[0].id).toBe(tracksToPlay[2].id);
			expect(response.body.data.tracks[1].id).toBe(tracksToPlay[1].id);
			expect(response.body.data.tracks[2].id).toBe(tracksToPlay[0].id);
		});

		it("should return 404 when track does not exist", async () => {
			// Attempt to record play for non-existent track
			const nonExistentTrackId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.post(`${HISTORY_API_BASE}/play`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ trackId: nonExistentTrackId.toString() });

			// Verify not found response
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/track not found/i);
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

			it("should return requested number of tracks with custom limit", async () => {
				// Record 30 track plays
				const tracksToPlay = testTracks.slice(0, 30);
				for (const track of tracksToPlay) {
					await recordPlayViaApi(authToken, track.id);
				}

				// Fetch with custom limit of 10
				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.query({ limit: 10 })
					.set("Authorization", `Bearer ${authToken}`);

				// Verify limit applied with correct total
				expect(response.status).toBe(200);
				expect(response.body.data.tracks).toHaveLength(10);
				expect(response.body.data.total).toBe(30);
			});

			it("should return default limit of 20 tracks", async () => {
				// Record 25 track plays
				const tracksToPlay = testTracks.slice(0, 25);
				for (const track of tracksToPlay) {
					await recordPlayViaApi(authToken, track.id);
				}

				// Fetch without specifying limit
				const response = await request(app)
					.get(`${HISTORY_API_BASE}/recently-played`)
					.set("Authorization", `Bearer ${authToken}`);

				// Verify default limit of 20 applied
				expect(response.status).toBe(200);
				expect(response.body.data.tracks).toHaveLength(20);
				expect(response.body.data.total).toBe(25);
			});
		});
	});

	describe("Clearing Play History", () => {
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
			// Record 10 track plays
			const tracksToPlay = testTracks.slice(0, 10);
			for (const track of tracksToPlay) {
				await recordPlayViaApi(authToken, track.id);
			}

			// Verify history has 10 entries
			const historyBefore = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(historyBefore.body.data.total).toBe(10);

			// Clear all history
			const response = await request(app)
				.delete(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);

			// Verify clear success message
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toMatch(/history cleared/i);

			// Verify history is empty
			const getResponse = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(getResponse.body.data.tracks).toHaveLength(0);
			expect(getResponse.body.data.total).toBe(0);
		});

		it("should not affect other users history when clearing", async () => {
			// Register two users
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

			// Record 10 plays for user A
			for (let i = 0; i < 10; i++) {
				await recordPlayViaApi(userA.token, testTracks[i % testTracks.length].id);
			}

			// Record 5 plays for user B
			for (let i = 0; i < 5; i++) {
				await recordPlayViaApi(userB.token, testTracks[(i + 10) % testTracks.length].id);
			}

			// Clear user A's history
			await request(app)
				.delete(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${userA.token}`);

			// Verify user A's history is empty
			const userAHistory = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${userA.token}`);

			expect(userAHistory.body.data.tracks).toHaveLength(0);

			// Verify user B's history is unaffected
			const userBHistory = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.set("Authorization", `Bearer ${userB.token}`);

			expect(userBHistory.body.data.tracks).toHaveLength(5);
		});
	});

	describe("History Limit Enforcement (FIFO)", () => {
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

		it("should evict oldest track when history exceeds 50", async () => {
			// Fill history to capacity (50 tracks)
			for (let i = 0; i < 50; i++) {
				await recordPlayViaApi(authToken, trackIds[i]);
			}

			// Verify history is at capacity
			const historyBefore = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.query({ limit: 50 })
				.set("Authorization", `Bearer ${authToken}`);

			expect(historyBefore.body.data.total).toBe(50);

			// Note the oldest track
			const oldestTrackId = historyBefore.body.data.tracks[historyBefore.body.data.tracks.length - 1].id;

			// Record one more track (51st)
			await recordPlayViaApi(authToken, trackIds[50]);

			// Fetch updated history
			const historyAfter = await request(app)
				.get(`${HISTORY_API_BASE}/recently-played`)
				.query({ limit: 50 })
				.set("Authorization", `Bearer ${authToken}`);

			// Verify total stays at 50 (FIFO eviction)
			expect(historyAfter.body.data.total).toBe(50);

			// Verify newest track is first
			expect(historyAfter.body.data.tracks[0].id).toBe(trackIds[50]);

			// Verify oldest track was evicted
			const allIds = historyAfter.body.data.tracks.map((t: { id: string }) => t.id);
			expect(allIds).not.toContain(oldestTrackId);
		}, 15000);
	});
});
