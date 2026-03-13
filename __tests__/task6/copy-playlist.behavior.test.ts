import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";
import { User } from "../../backend/src/features/users/user.model";
import { Playlist, IPlaylistDocument } from "../../backend/src/features/playlists/playlist.model";
import { Artist } from "../../backend/src/features/artists/artist.model";
import { Album } from "../../backend/src/features/albums/album.model";
import { Track, ITrackDocument } from "../../backend/src/features/tracks/track.model";

const config: Config = loadConfig(true);

const AUTH_BASE = "/api/auth";
const PLAYLISTS_BASE = "/api/playlists";

let app: Application;
let seededTrackIds: string[] = [];

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@melodio.com`;
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

describe("Copy Playlist", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

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

	it("should copy own playlist with all tracks", async () => {
		// Register and login user
		const userData = {
			email: generateUniqueEmail("copy-own"),
			username: generateUniqueUsername("copyown"),
			password: "Password123!",
			displayName: "Copy Own Playlist User",
		};
		const { token, userId } = await registerAndLoginUser(userData);

		// Get seeded track IDs
		const trackIds = getSeededTrackIds(5);
		expect(trackIds).toHaveLength(5);

		// Create original playlist
		const { playlistId } = await createPlaylistViaApi(token, {
			name: "My Original Playlist",
			description: "Original description",
			isPublic: true,
		});

		// Add tracks to original playlist
		const addedTrackIds = await addTracksToPlaylistAndVerify(token, playlistId, trackIds);
		expect(addedTrackIds).toHaveLength(5);

		// Copy the playlist
		const response = await request(app)
			.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
			.set("Authorization", `Bearer ${token}`)
			.send({});

		// Verify copied playlist metadata and tracks
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
		// Register user A (playlist owner)
		const userAData = {
			email: generateUniqueEmail("user-a-public"),
			username: generateUniqueUsername("userapublic"),
			password: "Password123!",
			displayName: "User A Public",
		};
		const { token: userAToken } = await registerAndLoginUser(userAData);

		// Register user B (will copy the playlist)
		const userBData = {
			email: generateUniqueEmail("user-b-public"),
			username: generateUniqueUsername("userbpublic"),
			password: "Password123!",
			displayName: "User B Public",
		};
		const { token: userBToken, userId: userBId } = await registerAndLoginUser(userBData);

		// Create public playlist with tracks as user A
		const trackIds = getSeededTrackIds(3);
		expect(trackIds).toHaveLength(3);

		const { playlistId: userAPlaylistId } = await createPlaylistViaApi(userAToken, {
			name: "User A Public Playlist",
			isPublic: true,
		});

		const addedTrackIds = await addTracksToPlaylistAndVerify(userAToken, userAPlaylistId, trackIds);
		expect(addedTrackIds).toHaveLength(3);

		// Copy user A's playlist as user B
		const response = await request(app)
			.post(`${PLAYLISTS_BASE}/${userAPlaylistId}/copy`)
			.set("Authorization", `Bearer ${userBToken}`)
			.send({});

		// Verify copy owned by user B with correct tracks
		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data.ownerId).toBe(userBId);
		expect(response.body.data.trackIds).toHaveLength(3);
		expect(response.body.data.name).toBe("Copy of User A Public Playlist");
	});

	it("should copy playlist with custom name when provided", async () => {
		// Register and login user
		const userData = {
			email: generateUniqueEmail("copy-custom"),
			username: generateUniqueUsername("copycustom"),
			password: "Password123!",
			displayName: "Copy Custom Name User",
		};
		const { token } = await registerAndLoginUser(userData);

		// Create original playlist
		const { playlistId } = await createPlaylistViaApi(token, {
			name: "Original Name",
			isPublic: true,
		});

		// Copy with custom name
		const customName = "My Custom Playlist Name";
		const response = await request(app)
			.post(`${PLAYLISTS_BASE}/${playlistId}/copy`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: customName });

		// Verify custom name applied
		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data.name).toBe(customName);
	});

	it("should have full access to copied playlist for requesting user", async () => {
		// Register user A (original owner)
		const userAData = {
			email: generateUniqueEmail("user-a-owner"),
			username: generateUniqueUsername("useraowner"),
			password: "Password123!",
			displayName: "User A Owner",
		};
		const { token: userAToken } = await registerAndLoginUser(userAData);

		// Register user B (will copy)
		const userBData = {
			email: generateUniqueEmail("user-b-owner"),
			username: generateUniqueUsername("userbowner"),
			password: "Password123!",
			displayName: "User B Owner",
		};
		const { token: userBToken, userId: userBId } = await registerAndLoginUser(userBData);

		// Create playlist as user A
		const { playlistId: userAPlaylistId } = await createPlaylistViaApi(userAToken, {
			name: "User A Playlist For Owner Test",
			isPublic: true,
		});

		// Copy playlist as user B
		const copyResponse = await request(app)
			.post(`${PLAYLISTS_BASE}/${userAPlaylistId}/copy`)
			.set("Authorization", `Bearer ${userBToken}`)
			.send({});

		// Verify user B owns the copy
		expect(copyResponse.status).toBe(201);
		expect(copyResponse.body.data.ownerId).toBe(userBId);

		// Verify user B can update the copied playlist
		const copiedPlaylistId = copyResponse.body.data._id;

		const updateResponse = await request(app)
			.patch(`${PLAYLISTS_BASE}/${copiedPlaylistId}`)
			.set("Authorization", `Bearer ${userBToken}`)
			.send({ name: "Updated by new owner" });

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.success).toBe(true);
		expect(updateResponse.body.data.name).toBe("Updated by new owner");

		// Verify user B can delete the copied playlist
		const deleteResponse = await request(app)
			.delete(`${PLAYLISTS_BASE}/${copiedPlaylistId}`)
			.set("Authorization", `Bearer ${userBToken}`);

		expect(deleteResponse.status).toBe(204);
	});

	it("should return 403 when copying private playlist from another user", async () => {
		// Register user A (private playlist owner)
		const userAData = {
			email: generateUniqueEmail("user-a-private"),
			username: generateUniqueUsername("useraprivate"),
			password: "Password123!",
			displayName: "User A Private",
		};
		const { token: userAToken } = await registerAndLoginUser(userAData);

		// Register user B (will attempt copy)
		const userBData = {
			email: generateUniqueEmail("user-b-private"),
			username: generateUniqueUsername("userbprivate"),
			password: "Password123!",
			displayName: "User B Private",
		};
		const { token: userBToken } = await registerAndLoginUser(userBData);

		// Create private playlist as user A
		const { playlistId: userAPrivatePlaylistId } = await createPlaylistViaApi(userAToken, {
			name: "User A Private Playlist",
			isPublic: false,
		});

		// Attempt to copy private playlist as user B
		const response = await request(app)
			.post(`${PLAYLISTS_BASE}/${userAPrivatePlaylistId}/copy`)
			.set("Authorization", `Bearer ${userBToken}`)
			.send({});

		// Verify forbidden response
		expect(response.status).toBe(403);
		expect(response.body.success).toBe(false);
		expect(response.body.error).toMatch(/cannot copy private playlist/i);
	});

	it("should return 404 when copying non-existent playlist", async () => {
		// Register and login user
		const userData = {
			email: generateUniqueEmail("copy-notfound"),
			username: generateUniqueUsername("copynotfound"),
			password: "Password123!",
			displayName: "Copy Not Found User",
		};
		const { token } = await registerAndLoginUser(userData);

		// Attempt to copy non-existent playlist
		const nonExistentId = new mongoose.Types.ObjectId();

		const response = await request(app)
			.post(`${PLAYLISTS_BASE}/${nonExistentId}/copy`)
			.set("Authorization", `Bearer ${token}`)
			.send({});

		// Verify not found response
		expect(response.status).toBe(404);
		expect(response.body.success).toBe(false);
		expect(response.body.error).toMatch(/playlist not found/i);
	});

	it("should return 403 when free user exceeds playlist limit", async () => {
		// Create a public playlist to copy from another user
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

		// Register free user and create 7 playlists (max limit)
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

		// Attempt to copy (exceeds limit)
		const copyResponse = await request(app)
			.post(`${PLAYLISTS_BASE}/${publicPlaylistId}/copy`)
			.set("Authorization", `Bearer ${token}`)
			.send({});

		// Verify playlist limit enforced
		expect(copyResponse.status).toBe(403);
		expect(copyResponse.body.success).toBe(false);
		expect(copyResponse.body.error).toMatch(/7 playlists/i);
	});
});
