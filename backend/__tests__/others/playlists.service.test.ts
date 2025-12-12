/**
 * INTRO: Playlist Service Integration Tests
 *
 * Tests playlist endpoints: CRUD operations, track management, authorization
 * Uses real MongoDB test database for integration testing.
 * These tests follow TDD approach - written BEFORE implementation.
 *
 * Test Coverage:
 * - GET /api/playlists: List user's own playlists sorted by updatedAt desc
 * - GET /api/playlists/:id: Get playlist with populated tracks
 * - POST /api/playlists: Create new playlist
 * - PATCH /api/playlists/:id: Update playlist metadata
 * - DELETE /api/playlists/:id: Delete playlist
 * - POST /api/playlists/:id/tracks: Add track to playlist
 * - DELETE /api/playlists/:id/tracks/:trackId: Remove track from playlist
 * - PATCH /api/playlists/:id/reorder: Reorder tracks in playlist
 *
 * Playlist Schema (snake_case in DB):
 * - name: String (required, trim)
 * - description: String (optional, trim)
 * - owner_id: ObjectId (ref: User, required)
 * - track_ids: ObjectId[] (ref: Track, ordered array)
 * - cover_image_url: String (optional)
 * - is_public: Boolean (default: true)
 * - timestamps: created_at, updated_at
 *
 * API Response Format (camelCase):
 * - Success: { success: true, data: {...} }
 * - Error: { success: false, error: "message" }
 *
 * Playlist Response Fields:
 * - id, name, description, ownerId, trackIds, tracks, coverImageUrl, isPublic, createdAt, updatedAt
 * - tracks: populated array of Track objects with artist and album info
 */

import * as dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../src/app";
import { loadConfig, Config } from "../../src/shared/config";
import {
	Artist,
	IArtistDocument,
} from "../../src/features/artists/artist.model";
import { Album, IAlbumDocument } from "../../src/features/albums/album.model";
import { Track, ITrackDocument } from "../../src/features/tracks/track.model";

// Load test configuration (appends _test to database name)
const config: Config = loadConfig(true);
const API_BASE = "/api/playlists";
const AUTH_BASE = "/api/auth";

// ============================================
// Playlist Model Definition (for tests only - TDD approach)
// Uses snake_case for DB fields, matching the expected implementation
// ============================================
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

const playlistSchema = new Schema<IPlaylistDocument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		owner_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		track_ids: [
			{
				type: Schema.Types.ObjectId,
				ref: "Track",
			},
		],
		cover_image_url: {
			type: String,
		},
		is_public: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

// Index on owner_id for filtering user's playlists
playlistSchema.index({ owner_id: 1 }, { name: "owner_id_asc_idx" });
// Descending index on updated_at for sorting
playlistSchema.index({ updated_at: -1 }, { name: "updated_at_desc_idx" });

// Use existing model if available, otherwise create new one
const Playlist: Model<IPlaylistDocument> =
	mongoose.models["Playlist"] ||
	mongoose.model<IPlaylistDocument>("Playlist", playlistSchema, "playlists");

// ============================================
// Test Data Factories
// ============================================

/**
 * Create a test playlist with optional overrides
 * Uses snake_case for DB fields
 */
const createTestPlaylist = (
	owner_id: mongoose.Types.ObjectId,
	overrides: Partial<Omit<IPlaylist, "owner_id">> = {},
): Partial<IPlaylist> => ({
	name: "Test Playlist",
	description: "A test playlist description",
	owner_id,
	track_ids: [],
	cover_image_url: "https://example.com/playlist-cover.jpg",
	is_public: true,
	...overrides,
});

/**
 * Create a test track with optional overrides
 * Uses snake_case for DB fields
 */
const createTestTrack = (
	artist_id: mongoose.Types.ObjectId,
	album_id: mongoose.Types.ObjectId,
	overrides: Partial<{
		title: string;
		duration_in_seconds: number;
		track_number: number;
		genre: string;
		play_count: number;
		cover_image_url?: string;
	}> = {},
) => ({
	title: "Test Track",
	artist_id,
	album_id,
	duration_in_seconds: 240,
	track_number: 1,
	genre: "rock",
	play_count: 0,
	cover_image_url: "https://example.com/track-cover.jpg",
	...overrides,
});

/**
 * Create a test album with optional overrides
 * Uses snake_case for DB fields
 */
const createTestAlbum = (
	artist_id: mongoose.Types.ObjectId,
	overrides: Partial<{
		title: string;
		release_date: Date;
		cover_image_url?: string;
		total_tracks: number;
	}> = {},
) => ({
	title: "Test Album",
	artist_id,
	release_date: new Date("2023-01-15"),
	cover_image_url: "https://example.com/album-cover.jpg",
	total_tracks: 12,
	...overrides,
});

/**
 * Create a test artist with optional overrides
 * Uses snake_case for DB fields
 */
const createTestArtist = (
	overrides: Partial<{
		name: string;
		bio?: string;
		image_url?: string;
		genres: string[];
		follower_count: number;
	}> = {},
) => ({
	name: "Test Artist",
	bio: "A talented musician",
	image_url: "https://example.com/artist.jpg",
	genres: ["Pop", "Rock"],
	follower_count: 1000,
	...overrides,
});

/**
 * Create a test user for authentication with unique credentials
 */
const createTestUser = (suffix = "") => ({
	email: `playlisttestuser${suffix}@example.com`,
	username: `playlisttestuser${suffix}`,
	password: "Password123!",
	displayName: `Playlist Test User ${suffix}`,
});

/**
 * Insert multiple artists into the database
 */
const insertArtists = async (
	artists: ReturnType<typeof createTestArtist>[],
): Promise<IArtistDocument[]> => {
	const result = await Artist.insertMany(artists);
	return result as IArtistDocument[];
};

/**
 * Insert multiple albums into the database
 */
const insertAlbums = async (
	albums: ReturnType<typeof createTestAlbum>[],
): Promise<IAlbumDocument[]> => {
	const result = await Album.insertMany(albums);
	return result as IAlbumDocument[];
};

/**
 * Insert multiple tracks into the database
 */
const insertTracks = async (
	tracks: ReturnType<typeof createTestTrack>[],
): Promise<ITrackDocument[]> => {
	const result = await Track.insertMany(tracks);
	return result as ITrackDocument[];
};

/**
 * Insert multiple playlists into the database
 */
const insertPlaylists = async (
	playlists: Partial<IPlaylist>[],
): Promise<IPlaylistDocument[]> => {
	const result = await Playlist.insertMany(playlists);
	return result as IPlaylistDocument[];
};

/**
 * Helper to register user and get auth token + user ID
 */
const registerAndGetAuth = async (
	app: Application,
	userData: ReturnType<typeof createTestUser>,
): Promise<{ token: string; userId: string }> => {
	const response = await request(app)
		.post(`${AUTH_BASE}/register`)
		.send(userData);

	return {
		token: response.body.data?.accessToken,
		userId: response.body.data?.user?.id || response.body.data?.user?._id,
	};
};

describe("Playlist Service", () => {
	let app: Application;
	let ownerToken: string;
	let ownerUserId: string;
	let nonOwnerToken: string;
	let nonOwnerUserId: string;
	let testArtist: IArtistDocument;
	let testAlbum: IAlbumDocument;
	let testTracks: ITrackDocument[];

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(config.mongodbUri);

		// Create Express app
		app = createApp();

		// Ensure indexes are created
		await Playlist.createIndexes();
		await Track.createIndexes();
		await Album.createIndexes();
		await Artist.createIndexes();
	});

	afterAll(async () => {
		// Clean up and disconnect
		await mongoose.connection.dropDatabase();
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		// Clear all collections before each test
		const collections = mongoose.connection.collections;
		for (const key in collections) {
			const collection = collections[key];
			if (collection) {
				await collection.deleteMany({});
			}
		}

		// Register owner user and get auth token
		const ownerData = createTestUser("owner");
		const ownerAuth = await registerAndGetAuth(app, ownerData);
		ownerToken = ownerAuth.token;
		ownerUserId = ownerAuth.userId;

		// Register non-owner user and get auth token
		const nonOwnerData = createTestUser("nonowner");
		const nonOwnerAuth = await registerAndGetAuth(app, nonOwnerData);
		nonOwnerToken = nonOwnerAuth.token;
		nonOwnerUserId = nonOwnerAuth.userId;

		// Create a default test artist
		const artistData = createTestArtist({ name: "Playlist Test Artist" });
		const insertedArtists = await insertArtists([artistData]);
		testArtist = insertedArtists[0]!;

		// Create a default test album
		const albumData = createTestAlbum(testArtist._id, {
			title: "Playlist Test Album",
		});
		const insertedAlbums = await insertAlbums([albumData]);
		testAlbum = insertedAlbums[0]!;

		// Create multiple test tracks
		const tracksData = [
			createTestTrack(testArtist._id, testAlbum._id, {
				title: "Track 1",
				track_number: 1,
			}),
			createTestTrack(testArtist._id, testAlbum._id, {
				title: "Track 2",
				track_number: 2,
			}),
			createTestTrack(testArtist._id, testAlbum._id, {
				title: "Track 3",
				track_number: 3,
			}),
		];
		testTracks = await insertTracks(tracksData);
	});

	// ============================================
	// 1. GET /api/playlists - List User's Playlists
	// ============================================
	describe("GET /api/playlists (List User Playlists)", () => {
		/**
		 * SCENARIO: Returns only authenticated user's playlists
		 * EXPECTATION: 200 OK with only owner's playlists
		 */
		it("should return only authenticated user's playlists (200)", async () => {
			// Arrange - Create playlists for owner and non-owner
			const ownerPlaylists = [
				createTestPlaylist(new mongoose.Types.ObjectId(ownerUserId), {
					name: "Owner Playlist 1",
				}),
				createTestPlaylist(new mongoose.Types.ObjectId(ownerUserId), {
					name: "Owner Playlist 2",
				}),
			];
			const nonOwnerPlaylist = createTestPlaylist(
				new mongoose.Types.ObjectId(nonOwnerUserId),
				{
					name: "Non-Owner Playlist",
				},
			);
			await insertPlaylists([...ownerPlaylists, nonOwnerPlaylist]);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data).toHaveLength(2);

			// Verify only owner's playlists are returned
			const playlistNames = response.body.data.map(
				(p: { name: string }) => p.name,
			);
			expect(playlistNames).toContain("Owner Playlist 1");
			expect(playlistNames).toContain("Owner Playlist 2");
			expect(playlistNames).not.toContain("Non-Owner Playlist");
		});

		/**
		 * SCENARIO: Playlists are sorted by updatedAt descending
		 * EXPECTATION: 200 OK with playlists sorted newest first
		 */
		it("should return playlists sorted by updatedAt descending (200)", async () => {
			// Arrange - Create playlists with delays to ensure different timestamps
			const ownerId = new mongoose.Types.ObjectId(ownerUserId);

			const playlist1 = await Playlist.create(
				createTestPlaylist(ownerId, {
					name: "Old Playlist",
				}),
			);

			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 50));

			const playlist2 = await Playlist.create(
				createTestPlaylist(ownerId, {
					name: "Newer Playlist",
				}),
			);

			await new Promise((resolve) => setTimeout(resolve, 50));

			const playlist3 = await Playlist.create(
				createTestPlaylist(ownerId, {
					name: "Newest Playlist",
				}),
			);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveLength(3);

			// Verify sorting by updatedAt descending (newest first)
			const items = response.body.data;
			expect(items[0].name).toBe("Newest Playlist");
			expect(items[1].name).toBe("Newer Playlist");
			expect(items[2].name).toBe("Old Playlist");
		});

		/**
		 * SCENARIO: Returns empty array if no playlists exist
		 * EXPECTATION: 200 OK with empty array
		 */
		it("should return empty array if no playlists exist (200)", async () => {
			// Act - No playlists created for owner
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data).toHaveLength(0);
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Act - No Authorization header
			const response = await request(app)
				.get(API_BASE)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request with invalid token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized with invalid token", async () => {
			// Act - Invalid token
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", "Bearer invalid.token.here")
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 2. GET /api/playlists/:id - Get Playlist by ID
	// ============================================
	describe("GET /api/playlists/:id (Get Playlist by ID)", () => {
		/**
		 * SCENARIO: Owner can view own playlist with populated tracks
		 * EXPECTATION: 200 OK with playlist including tracks with artist and album info
		 */
		it("should return playlist with populated tracks (200)", async () => {
			// Arrange - Create playlist with tracks
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist With Tracks",
					track_ids: testTracks.map((t) => t._id),
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();

			const result = response.body.data;
			expect(result.id || result._id).toBe(playlist._id.toString());
			expect(result.name).toBe("Playlist With Tracks");

			// Verify tracks are populated
			expect(result.tracks).toBeDefined();
			expect(result.tracks).toBeInstanceOf(Array);
			expect(result.tracks).toHaveLength(3);

			// Verify track has artist and album info populated
			const firstTrack = result.tracks[0];
			expect(firstTrack.title).toBeDefined();
			expect(firstTrack.artist).toBeDefined();
			expect(firstTrack.artist.name).toBe("Playlist Test Artist");
			expect(firstTrack.album).toBeDefined();
			expect(firstTrack.album.title).toBe("Playlist Test Album");
		});

		/**
		 * SCENARIO: Owner can view own private playlist
		 * EXPECTATION: 200 OK with private playlist
		 */
		it("should allow owner to view own private playlist (200)", async () => {
			// Arrange - Create private playlist
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Private Playlist",
					is_public: false,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Private Playlist");
			expect(response.body.data.isPublic).toBe(false);
		});

		/**
		 * SCENARIO: Non-owner can view public playlist
		 * EXPECTATION: 200 OK with public playlist
		 */
		it("should allow non-owner to view public playlist (200)", async () => {
			// Arrange - Create public playlist owned by owner
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Public Playlist",
					is_public: true,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Non-owner tries to access
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Public Playlist");
		});

		/**
		 * SCENARIO: Non-owner gets 403 for private playlist
		 * EXPECTATION: 403 Forbidden
		 */
		it("should return 403 Forbidden when non-owner accesses private playlist", async () => {
			// Arrange - Create private playlist owned by owner
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Private Playlist",
					is_public: false,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Non-owner tries to access
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Request for non-existent playlist
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent playlist", async () => {
			// Arrange - Valid ObjectId that doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${nonExistentId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request with invalid ObjectId format
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for invalid ObjectId format", async () => {
			// Arrange - Invalid ObjectId
			const invalidId = "not-a-valid-objectid";

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${invalidId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 3. POST /api/playlists - Create Playlist
	// ============================================
	describe("POST /api/playlists (Create Playlist)", () => {
		/**
		 * SCENARIO: Creates playlist with name only (description optional)
		 * EXPECTATION: 201 Created with new playlist
		 */
		it("should create playlist with name only (201)", async () => {
			// Arrange
			const playlistData = {
				name: "My New Playlist",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data.name).toBe("My New Playlist");
			expect(response.body.data.id || response.body.data._id).toBeDefined();
		});

		/**
		 * SCENARIO: Creates playlist with name and description
		 * EXPECTATION: 201 Created with new playlist including description
		 */
		it("should create playlist with name and description (201)", async () => {
			// Arrange
			const playlistData = {
				name: "Playlist With Description",
				description: "This is my awesome playlist",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Playlist With Description");
			expect(response.body.data.description).toBe(
				"This is my awesome playlist",
			);
		});

		/**
		 * SCENARIO: Sets isPublic to true by default
		 * EXPECTATION: 201 Created with isPublic: true
		 */
		it("should set isPublic to true by default (201)", async () => {
			// Arrange
			const playlistData = {
				name: "Default Public Playlist",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isPublic).toBe(true);
		});

		/**
		 * SCENARIO: Sets owner_id from authenticated user
		 * EXPECTATION: 201 Created with ownerId matching authenticated user
		 */
		it("should set ownerId from authenticated user (201)", async () => {
			// Arrange
			const playlistData = {
				name: "Owned Playlist",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.ownerId).toBe(ownerUserId);
		});

		/**
		 * SCENARIO: Initializes trackIds as empty array
		 * EXPECTATION: 201 Created with empty trackIds
		 */
		it("should initialize trackIds as empty array (201)", async () => {
			// Arrange
			const playlistData = {
				name: "Empty Playlist",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.trackIds).toBeInstanceOf(Array);
			expect(response.body.data.trackIds).toHaveLength(0);
		});

		/**
		 * SCENARIO: Returns 400 for missing name
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for missing name", async () => {
			// Arrange - No name field
			const playlistData = {
				description: "No name provided",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Returns 400 for empty name
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for empty name", async () => {
			// Arrange - Empty name
			const playlistData = {
				name: "",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Returns 400 for whitespace-only name
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for whitespace-only name", async () => {
			// Arrange - Whitespace only name
			const playlistData = {
				name: "   ",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const playlistData = {
				name: "Unauthorized Playlist",
			};

			// Act - No Authorization header
			const response = await request(app)
				.post(API_BASE)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Can create private playlist explicitly
		 * EXPECTATION: 201 Created with isPublic: false
		 */
		it("should create private playlist when isPublic is false (201)", async () => {
			// Arrange
			const playlistData = {
				name: "Private Playlist",
				isPublic: false,
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isPublic).toBe(false);
		});
	});

	// ============================================
	// 4. PATCH /api/playlists/:id - Update Playlist
	// ============================================
	describe("PATCH /api/playlists/:id (Update Playlist)", () => {
		/**
		 * SCENARIO: Owner can update playlist name
		 * EXPECTATION: 200 OK with updated name
		 */
		it("should allow owner to update playlist name (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Original Name",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ name: "Updated Name" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Updated Name");
		});

		/**
		 * SCENARIO: Owner can update playlist description
		 * EXPECTATION: 200 OK with updated description
		 */
		it("should allow owner to update playlist description (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
					description: "Original description",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ description: "Updated description" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.description).toBe("Updated description");
		});

		/**
		 * SCENARIO: Owner can change isPublic status
		 * EXPECTATION: 200 OK with updated isPublic
		 */
		it("should allow owner to change isPublic status (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
					is_public: true,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ isPublic: false })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isPublic).toBe(false);
		});

		/**
		 * SCENARIO: Owner can update coverImageUrl
		 * EXPECTATION: 200 OK with updated coverImageUrl
		 */
		it("should allow owner to update coverImageUrl (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			const newCoverUrl = "https://example.com/new-cover.jpg";

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ coverImageUrl: newCoverUrl })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.coverImageUrl).toBe(newCoverUrl);
		});

		/**
		 * SCENARIO: Partial updates work (only provided fields change)
		 * EXPECTATION: 200 OK with only specified field updated
		 */
		it("should only update provided fields (partial update) (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Original Name",
					description: "Original description",
					is_public: true,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Only update name
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ name: "Updated Name" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Updated Name");
			// Other fields should remain unchanged
			expect(response.body.data.description).toBe("Original description");
			expect(response.body.data.isPublic).toBe(true);
		});

		/**
		 * SCENARIO: Non-owner gets 403 when trying to update
		 * EXPECTATION: 403 Forbidden
		 */
		it("should return 403 Forbidden when non-owner tries to update", async () => {
			// Arrange - Playlist owned by owner
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Owner's Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Non-owner tries to update
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.send({ name: "Hacked Name" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Returns 404 for non-existent playlist
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent playlist", async () => {
			// Arrange - Valid ObjectId that doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${nonExistentId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ name: "Updated Name" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.send({ name: "Updated Name" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 5. DELETE /api/playlists/:id - Delete Playlist
	// ============================================
	describe("DELETE /api/playlists/:id (Delete Playlist)", () => {
		/**
		 * SCENARIO: Owner can delete own playlist
		 * EXPECTATION: 204 No Content
		 */
		it("should allow owner to delete own playlist (204)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist To Delete",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`);

			// Assert
			expect(response.status).toBe(204);

			// Verify playlist is deleted
			const deletedPlaylist = await Playlist.findById(playlist._id);
			expect(deletedPlaylist).toBeNull();
		});

		/**
		 * SCENARIO: Non-owner gets 403 when trying to delete
		 * EXPECTATION: 403 Forbidden
		 */
		it("should return 403 Forbidden when non-owner tries to delete", async () => {
			// Arrange - Playlist owned by owner
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Owner's Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Non-owner tries to delete
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();

			// Verify playlist still exists
			const existingPlaylist = await Playlist.findById(playlist._id);
			expect(existingPlaylist).not.toBeNull();
		});

		/**
		 * SCENARIO: Returns 404 for non-existent playlist
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent playlist", async () => {
			// Arrange - Valid ObjectId that doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.delete(`${API_BASE}/${nonExistentId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 6. POST /api/playlists/:id/tracks - Add Track to Playlist
	// ============================================
	describe("POST /api/playlists/:id/tracks (Add Track to Playlist)", () => {
		/**
		 * SCENARIO: Owner can add track to playlist
		 * EXPECTATION: 200 OK with updated playlist
		 */
		it("should allow owner to add track to playlist (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist for Adding Tracks",
					track_ids: [],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;
			const trackId = testTracks[0]!._id;

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${playlist._id}/tracks`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackId: trackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.trackIds).toContain(trackId.toString());
		});

		/**
		 * SCENARIO: Track is added to end of trackIds array
		 * EXPECTATION: 200 OK with track at end of array
		 */
		it("should add track to end of trackIds array (200)", async () => {
			// Arrange - Playlist with existing track
			const existingTrackId = testTracks[0]!._id;
			const newTrackId = testTracks[1]!._id;

			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist with Tracks",
					track_ids: [existingTrackId],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${playlist._id}/tracks`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackId: newTrackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.trackIds).toHaveLength(2);
			expect(response.body.data.trackIds[0]).toBe(existingTrackId.toString());
			expect(response.body.data.trackIds[1]).toBe(newTrackId.toString());
		});

		/**
		 * SCENARIO: Adding duplicate track is idempotent
		 * EXPECTATION: 200 OK with no duplicate added
		 */
		it("should be idempotent when adding duplicate track (200)", async () => {
			// Arrange - Playlist with existing track
			const trackId = testTracks[0]!._id;

			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist with Track",
					track_ids: [trackId],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Try to add same track again
			const response = await request(app)
				.post(`${API_BASE}/${playlist._id}/tracks`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackId: trackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			// Track should not be duplicated
			expect(response.body.data.trackIds).toHaveLength(1);
			expect(response.body.data.trackIds[0]).toBe(trackId.toString());
		});

		/**
		 * SCENARIO: Non-owner gets 403 when trying to add track
		 * EXPECTATION: 403 Forbidden
		 */
		it("should return 403 Forbidden when non-owner tries to add track", async () => {
			// Arrange - Playlist owned by owner
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Owner's Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;
			const trackId = testTracks[0]!._id;

			// Act - Non-owner tries to add track
			const response = await request(app)
				.post(`${API_BASE}/${playlist._id}/tracks`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.send({ trackId: trackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent playlist
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent playlist", async () => {
			// Arrange - Valid ObjectId that doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();
			const trackId = testTracks[0]!._id;

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${nonExistentId}/tracks`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackId: trackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent track
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent track", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;
			const nonExistentTrackId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${playlist._id}/tracks`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackId: nonExistentTrackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;
			const trackId = testTracks[0]!._id;

			// Act - No Authorization header
			const response = await request(app)
				.post(`${API_BASE}/${playlist._id}/tracks`)
				.send({ trackId: trackId.toString() })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 7. DELETE /api/playlists/:id/tracks/:trackId - Remove Track from Playlist
	// ============================================
	describe("DELETE /api/playlists/:id/tracks/:trackId (Remove Track from Playlist)", () => {
		/**
		 * SCENARIO: Owner can remove track from playlist
		 * EXPECTATION: 200 OK with updated playlist
		 */
		it("should allow owner to remove track from playlist (200)", async () => {
			// Arrange
			const trackId = testTracks[0]!._id;
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist for Removing Tracks",
					track_ids: [trackId, testTracks[1]!._id],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}/tracks/${trackId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.trackIds).not.toContain(trackId.toString());
			expect(response.body.data.trackIds).toHaveLength(1);
		});

		/**
		 * SCENARIO: Removing non-existent track is idempotent
		 * EXPECTATION: 200 OK with no error
		 */
		it("should be idempotent when removing non-existent track (200)", async () => {
			// Arrange - Playlist without the track we try to remove
			const trackId = testTracks[0]!._id;
			const otherTrackId = testTracks[1]!._id;

			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist Without Track",
					track_ids: [otherTrackId],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Try to remove track that's not in playlist
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}/tracks/${trackId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			// Playlist should remain unchanged
			expect(response.body.data.trackIds).toHaveLength(1);
			expect(response.body.data.trackIds[0]).toBe(otherTrackId.toString());
		});

		/**
		 * SCENARIO: Non-owner gets 403 when trying to remove track
		 * EXPECTATION: 403 Forbidden
		 */
		it("should return 403 Forbidden when non-owner tries to remove track", async () => {
			// Arrange - Playlist owned by owner
			const trackId = testTracks[0]!._id;
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Owner's Playlist",
					track_ids: [trackId],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - Non-owner tries to remove track
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}/tracks/${trackId}`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent playlist
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent playlist", async () => {
			// Arrange - Valid ObjectId that doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();
			const trackId = testTracks[0]!._id;

			// Act
			const response = await request(app)
				.delete(`${API_BASE}/${nonExistentId}/tracks/${trackId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const trackId = testTracks[0]!._id;
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
					track_ids: [trackId],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.delete(`${API_BASE}/${playlist._id}/tracks/${trackId}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 8. PATCH /api/playlists/:id/reorder - Reorder Tracks
	// ============================================
	describe("PATCH /api/playlists/:id/reorder (Reorder Tracks)", () => {
		/**
		 * SCENARIO: Owner can reorder tracks
		 * EXPECTATION: 200 OK with new track order
		 */
		it("should allow owner to reorder tracks (200)", async () => {
			// Arrange
			const trackIds = testTracks.map((t) => t._id);
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist for Reordering",
					track_ids: trackIds,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// New order: reverse the tracks
			const newOrder = [...trackIds].reverse().map((id) => id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}/reorder`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackIds: newOrder })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.trackIds).toEqual(newOrder);
		});

		/**
		 * SCENARIO: Returns playlist with new track order
		 * EXPECTATION: 200 OK with correctly ordered tracks
		 */
		it("should return playlist with new track order (200)", async () => {
			// Arrange
			const trackIds = testTracks.map((t) => t._id);
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist for Reordering",
					track_ids: trackIds,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Shuffle the order: [1, 2, 3] -> [3, 1, 2]
			const newOrder = [
				trackIds[2]!.toString(),
				trackIds[0]!.toString(),
				trackIds[1]!.toString(),
			];

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}/reorder`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackIds: newOrder })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.trackIds[0]).toBe(trackIds[2]!.toString());
			expect(response.body.data.trackIds[1]).toBe(trackIds[0]!.toString());
			expect(response.body.data.trackIds[2]).toBe(trackIds[1]!.toString());
		});

		/**
		 * SCENARIO: Non-owner gets 403 when trying to reorder
		 * EXPECTATION: 403 Forbidden
		 */
		it("should return 403 Forbidden when non-owner tries to reorder", async () => {
			// Arrange - Playlist owned by owner
			const trackIds = testTracks.map((t) => t._id);
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Owner's Playlist",
					track_ids: trackIds,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			const newOrder = [...trackIds].reverse().map((id) => id.toString());

			// Act - Non-owner tries to reorder
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}/reorder`)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.send({ trackIds: newOrder })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Returns 400 if track IDs don't match current playlist
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request if trackIds don't match playlist tracks", async () => {
			// Arrange
			const trackIds = testTracks.map((t) => t._id);
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist for Reordering",
					track_ids: trackIds.slice(0, 2), // Only first 2 tracks
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Try to reorder with all 3 tracks (includes one not in playlist)
			const wrongOrder = trackIds.map((id) => id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}/reorder`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackIds: wrongOrder })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Returns 400 if trackIds array is missing tracks
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request if trackIds array is missing tracks", async () => {
			// Arrange
			const trackIds = testTracks.map((t) => t._id);
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Playlist for Reordering",
					track_ids: trackIds,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Try to reorder with only 2 tracks (missing one)
			const incompleteOrder = trackIds.slice(0, 2).map((id) => id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}/reorder`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackIds: incompleteOrder })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent playlist
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent playlist", async () => {
			// Arrange - Valid ObjectId that doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();
			const trackIds = testTracks.map((t) => t._id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${nonExistentId}/reorder`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ trackIds })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const trackIds = testTracks.map((t) => t._id);
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Test Playlist",
					track_ids: trackIds,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			const newOrder = trackIds.map((id) => id.toString());

			// Act - No Authorization header
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}/reorder`)
				.send({ trackIds: newOrder })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// Edge Cases and Error Handling
	// ============================================
	describe("Edge Cases and Error Handling", () => {
		/**
		 * SCENARIO: Verify playlist response contains all expected fields
		 * EXPECTATION: 200 OK with complete playlist object
		 */
		it("should return playlist with all expected fields (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Complete Fields Playlist",
					description: "Full description",
					cover_image_url: "https://example.com/complete-cover.jpg",
					is_public: true,
					track_ids: [testTracks[0]!._id],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			const result = response.body.data;

			// Verify all expected fields
			expect(result.id || result._id).toBeDefined();
			expect(result.name).toBe("Complete Fields Playlist");
			expect(result.description).toBe("Full description");
			expect(result.ownerId).toBe(ownerUserId);
			expect(result.trackIds).toBeDefined();
			expect(result.coverImageUrl).toBe(
				"https://example.com/complete-cover.jpg",
			);
			expect(result.isPublic).toBe(true);
			expect(result.createdAt).toBeDefined();
			expect(result.updatedAt).toBeDefined();
		});

		/**
		 * SCENARIO: Malformed Authorization header
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for malformed Authorization header", async () => {
			// Act - Missing "Bearer" prefix
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", ownerToken)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Short invalid ID format
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for short invalid ID", async () => {
			// Arrange - Too short to be valid ObjectId
			const shortId = "123";

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${shortId}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Empty playlist (no tracks)
		 * EXPECTATION: 200 OK with empty tracks array
		 */
		it("should handle empty playlist with no tracks (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Empty Playlist",
					track_ids: [],
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.tracks).toBeInstanceOf(Array);
			expect(response.body.data.tracks).toHaveLength(0);
		});

		/**
		 * SCENARIO: Playlist with many tracks
		 * EXPECTATION: 200 OK with all tracks populated
		 */
		it("should handle playlist with many tracks (200)", async () => {
			// Arrange - Create more tracks
			const moreTracks = Array.from({ length: 10 }, (_, i) =>
				createTestTrack(testArtist._id, testAlbum._id, {
					title: `Track ${i + 10}`,
					track_number: i + 10,
				}),
			);
			const insertedTracks = await insertTracks(moreTracks);
			const allTrackIds = [...testTracks, ...insertedTracks].map((t) => t._id);

			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Large Playlist",
					track_ids: allTrackIds,
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.tracks).toHaveLength(allTrackIds.length);
		});

		/**
		 * SCENARIO: Non-owner viewing their own playlists does not see owner's
		 * EXPECTATION: 200 OK with only non-owner's playlists
		 */
		it("should return only the requesting user's playlists", async () => {
			// Arrange - Create playlists for both users
			await insertPlaylists([
				createTestPlaylist(new mongoose.Types.ObjectId(ownerUserId), {
					name: "Owner's Playlist",
				}),
				createTestPlaylist(new mongoose.Types.ObjectId(nonOwnerUserId), {
					name: "Non-Owner's Playlist",
				}),
			]);

			// Act - Non-owner requests their playlists
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${nonOwnerToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0].name).toBe("Non-Owner's Playlist");
		});

		/**
		 * SCENARIO: Creating playlist with all optional fields
		 * EXPECTATION: 201 Created with all fields set
		 */
		it("should create playlist with all optional fields (201)", async () => {
			// Arrange
			const playlistData = {
				name: "Full Featured Playlist",
				description: "A complete playlist with all fields",
				isPublic: false,
				coverImageUrl: "https://example.com/custom-cover.jpg",
			};

			// Act
			const response = await request(app)
				.post(API_BASE)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send(playlistData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Full Featured Playlist");
			expect(response.body.data.description).toBe(
				"A complete playlist with all fields",
			);
			expect(response.body.data.isPublic).toBe(false);
			expect(response.body.data.coverImageUrl).toBe(
				"https://example.com/custom-cover.jpg",
			);
		});

		/**
		 * SCENARIO: Updating playlist updates the updatedAt timestamp
		 * EXPECTATION: 200 OK with newer updatedAt
		 */
		it("should update updatedAt timestamp on playlist update (200)", async () => {
			// Arrange
			const playlistData = createTestPlaylist(
				new mongoose.Types.ObjectId(ownerUserId),
				{
					name: "Original Playlist",
				},
			);
			const insertedPlaylists = await insertPlaylists([playlistData]);
			const playlist = insertedPlaylists[0]!;
			const originalUpdatedAt = playlist.updated_at;

			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Act
			const response = await request(app)
				.patch(`${API_BASE}/${playlist._id}`)
				.set("Authorization", `Bearer ${ownerToken}`)
				.send({ name: "Updated Playlist" })
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			const newUpdatedAt = new Date(response.body.data.updatedAt);
			expect(newUpdatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});
});
