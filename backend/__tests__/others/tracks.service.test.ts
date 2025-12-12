/**
 * INTRO: Track Service Integration Tests
 *
 * Tests track endpoints: list (paginated with filters), search, get by ID, play
 * Uses real MongoDB test database for integration testing.
 * These tests follow TDD approach - written BEFORE implementation.
 *
 * Test Coverage:
 * - GET /api/tracks: Paginated list sorted by createdAt desc, filters: genre, artistId, albumId
 * - GET /api/tracks/search: Text search by title prefix or exact genre, max 5 results
 * - GET /api/tracks/:id: Get single track with populated artist (name, imageUrl) and album (title, coverImageUrl)
 * - POST /api/tracks/:id/play: Increment play_count and return updated track
 *
 * Track Schema (snake_case for DB fields):
 * - title: String (required, trim)
 * - artist_id: ObjectId (ref: Artist, required)
 * - album_id: ObjectId (ref: Album, required)
 * - duration_in_seconds: Number (required, min: 1)
 * - track_number: Number (required, min: 1)
 * - genre: String (required, trim, lowercase)
 * - play_count: Number (optional, min: 0, default: 0)
 * - cover_image_url: String (optional)
 * - timestamps: created_at, updated_at
 *
 * Indexes:
 * - Text index on `title` (for full-text search)
 * - Ascending index on `artist_id`
 * - Ascending index on `album_id`
 * - Ascending index on `genre`
 * - Descending index on `play_count`
 *
 * Response Format:
 * - Success: { success: true, data: {...} }
 * - Error: { success: false, error: "message" }
 * - Paginated: { success: true, data: { items: [...], total, page, limit, totalPages } }
 *
 * Track Response Fields (camelCase for API):
 * - id, title, artist, album, durationInSeconds, trackNumber, genre, playCount, coverImageUrl, createdAt, updatedAt
 * - artist: { id, name, imageUrl } (populated from artist_id)
 * - album: { id, title, coverImageUrl } (populated from album_id)
 */

import * as dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../src/app";
import { loadConfig, Config } from "../../src/shared/config";
import { Artist, IArtistDocument } from "../../src/features/artists/artist.model";
import { Album, IAlbumDocument } from "../../src/features/albums/album.model";

// Load test configuration (appends _test to database name)
const config: Config = loadConfig(true);
const API_BASE = "/api/tracks";
const AUTH_BASE = "/api/auth";

// ============================================
// Track Model Definition (for tests only - TDD approach)
// Uses snake_case for DB fields, matching the expected implementation
// ============================================
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
		title: {
			type: String,
			required: true,
			trim: true,
		},
		artist_id: {
			type: Schema.Types.ObjectId,
			ref: "Artist",
			required: true,
		},
		album_id: {
			type: Schema.Types.ObjectId,
			ref: "Album",
			required: true,
		},
		duration_in_seconds: {
			type: Number,
			required: true,
			min: 1,
		},
		track_number: {
			type: Number,
			required: true,
			min: 1,
		},
		genre: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		play_count: {
			type: Number,
			min: 0,
			default: 0,
		},
		cover_image_url: {
			type: String,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

// Text index on title for search functionality
trackSchema.index({ title: "text" });
// Ascending index on artist_id for filtering
trackSchema.index({ artist_id: 1 });
// Ascending index on album_id for filtering
trackSchema.index({ album_id: 1 });
// Ascending index on genre for filtering
trackSchema.index({ genre: 1 });
// Descending index on play_count for sorting popular tracks
trackSchema.index({ play_count: -1 });

// Use existing model if available, otherwise create new one
const Track: Model<ITrackDocument> =
	mongoose.models["Track"] ||
	mongoose.model<ITrackDocument>("Track", trackSchema, "tracks");

// ============================================
// Test Data Factories
// ============================================

/**
 * Create a test track with optional overrides
 * Uses snake_case for DB fields
 */
const createTestTrack = (
	artist_id: mongoose.Types.ObjectId,
	album_id: mongoose.Types.ObjectId,
	overrides: Partial<Omit<ITrack, "artist_id" | "album_id">> = {},
): Partial<ITrack> => ({
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
 * Create a test user for authentication
 */
const createTestUser = (overrides = {}) => ({
	email: "tracktestuser@example.com",
	username: "tracktestuser",
	password: "Password123!",
	displayName: "Track Test User",
	...overrides,
});

/**
 * Insert multiple artists into the database
 */
const insertArtists = async (
	artists: Partial<{
		name: string;
		bio?: string;
		image_url?: string;
		genres: string[];
		follower_count: number;
	}>[],
): Promise<IArtistDocument[]> => {
	const result = await Artist.insertMany(artists);
	return result as IArtistDocument[];
};

/**
 * Insert multiple albums into the database
 */
const insertAlbums = async (
	albums: Partial<{
		title: string;
		artist_id: mongoose.Types.ObjectId;
		release_date: Date;
		cover_image_url?: string;
		total_tracks: number;
	}>[],
): Promise<IAlbumDocument[]> => {
	const result = await Album.insertMany(albums);
	return result as IAlbumDocument[];
};

/**
 * Insert multiple tracks into the database
 */
const insertTracks = async (
	tracks: Partial<ITrack>[],
): Promise<ITrackDocument[]> => {
	const result = await Track.insertMany(tracks);
	return result as ITrackDocument[];
};

describe("Track Service", () => {
	let app: Application;
	let authToken: string;
	let testArtist: IArtistDocument;
	let testAlbum: IAlbumDocument;

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(config.mongodbUri);

		// Create Express app
		app = createApp();

		// Ensure indexes are created
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

		// Register a user and get auth token for authenticated requests
		const userData = createTestUser();
		const registerResponse = await request(app)
			.post(`${AUTH_BASE}/register`)
			.send(userData);

		authToken = registerResponse.body.data?.accessToken;

		// Create a default test artist for track tests
		const artistData = createTestArtist({ name: "Default Track Artist" });
		const insertedArtists = await insertArtists([artistData]);
		testArtist = insertedArtists[0]!;

		// Create a default test album for track tests
		const albumData = createTestAlbum(testArtist._id, {
			title: "Default Track Album",
		});
		const insertedAlbums = await insertAlbums([albumData]);
		testAlbum = insertedAlbums[0]!;
	});

	// ============================================
	// GET /api/tracks - Paginated List with Filters
	// ============================================
	describe("GET /api/tracks (Paginated List + Filters)", () => {
		/**
		 * SCENARIO: Returns paginated tracks sorted by createdAt descending
		 * EXPECTATION: 200 OK with tracks sorted by createdAt desc
		 */
		it("should return paginated tracks sorted by createdAt descending (200)", async () => {
			// Arrange - Create tracks with different creation times
			// Insert one at a time with delays to ensure different timestamps
			const track1 = await Track.create(
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "First Track",
					track_number: 1,
				}),
			);

			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 50));

			const track2 = await Track.create(
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Second Track",
					track_number: 2,
				}),
			);

			await new Promise((resolve) => setTimeout(resolve, 50));

			const track3 = await Track.create(
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Third Track",
					track_number: 3,
				}),
			);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data.items).toBeInstanceOf(Array);
			expect(response.body.data.items).toHaveLength(3);

			// Verify sorting by createdAt descending (newest first)
			const items = response.body.data.items;
			expect(items[0].title).toBe("Third Track");
			expect(items[1].title).toBe("Second Track");
			expect(items[2].title).toBe("First Track");

			// Verify pagination metadata
			expect(response.body.data.total).toBe(3);
			expect(response.body.data.page).toBe(1);
			expect(response.body.data.totalPages).toBeDefined();
		});

		/**
		 * SCENARIO: Uses default pagination when not specified
		 * EXPECTATION: 200 OK with page=1 and limit=20
		 */
		it("should use default pagination (page=1, limit=20) when not specified (200)", async () => {
			// Arrange - Create 25 tracks
			const tracks = Array.from({ length: 25 }, (_, i) =>
				createTestTrack(testArtist._id, testAlbum._id, {
					title: `Track ${i + 1}`,
					track_number: i + 1,
					duration_in_seconds: 180 + i,
				}),
			);
			await insertTracks(tracks);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(20);
			expect(response.body.data.page).toBe(1);
			expect(response.body.data.limit).toBe(20);
			expect(response.body.data.total).toBe(25);
			expect(response.body.data.totalPages).toBe(2);
		});

		/**
		 * SCENARIO: Filters tracks by genre (case-insensitive)
		 * EXPECTATION: 200 OK with only tracks matching the genre
		 */
		it("should filter tracks by genre (case-insensitive) (200)", async () => {
			// Arrange - Create tracks with different genres
			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Rock Track 1",
					genre: "rock",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Rock Track 2",
					genre: "rock",
					track_number: 2,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Jazz Track",
					genre: "jazz",
					track_number: 3,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Pop Track",
					genre: "pop",
					track_number: 4,
				}),
			];
			await insertTracks(tracks);

			// Act - Filter by "rock" genre (with uppercase to test case-insensitivity)
			const response = await request(app)
				.get(`${API_BASE}?genre=ROCK`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(2);

			// Verify all returned tracks have the specified genre
			const trackTitles = response.body.data.items.map(
				(t: { title: string }) => t.title,
			);
			expect(trackTitles).toContain("Rock Track 1");
			expect(trackTitles).toContain("Rock Track 2");
			expect(trackTitles).not.toContain("Jazz Track");
			expect(trackTitles).not.toContain("Pop Track");
		});

		/**
		 * SCENARIO: Filters tracks by artistId
		 * EXPECTATION: 200 OK with only tracks by the specified artist
		 */
		it("should filter tracks by artistId (200)", async () => {
			// Arrange - Create two artists and tracks for each
			const secondArtist = (
				await insertArtists([
					createTestArtist({ name: "Second Artist", follower_count: 500 }),
				])
			)[0]!;

			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "First Artist Track 1",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "First Artist Track 2",
					track_number: 2,
				}),
				createTestTrack(secondArtist._id, testAlbum._id, {
					title: "Second Artist Track",
					track_number: 3,
				}),
			];
			await insertTracks(tracks);

			// Act - Filter by testArtist's ID
			const response = await request(app)
				.get(`${API_BASE}?artistId=${testArtist._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(2);

			// Verify all returned tracks belong to the specified artist
			const trackTitles = response.body.data.items.map(
				(t: { title: string }) => t.title,
			);
			expect(trackTitles).toContain("First Artist Track 1");
			expect(trackTitles).toContain("First Artist Track 2");
			expect(trackTitles).not.toContain("Second Artist Track");
		});

		/**
		 * SCENARIO: Filters tracks by albumId
		 * EXPECTATION: 200 OK with only tracks from the specified album
		 */
		it("should filter tracks by albumId (200)", async () => {
			// Arrange - Create second album and tracks for each album
			const secondAlbum = (
				await insertAlbums([
					createTestAlbum(testArtist._id, { title: "Second Album" }),
				])
			)[0]!;

			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Album 1 Track 1",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Album 1 Track 2",
					track_number: 2,
				}),
				createTestTrack(testArtist._id, secondAlbum._id, {
					title: "Album 2 Track",
					track_number: 1,
				}),
			];
			await insertTracks(tracks);

			// Act - Filter by testAlbum's ID
			const response = await request(app)
				.get(`${API_BASE}?albumId=${testAlbum._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(2);

			// Verify all returned tracks belong to the specified album
			const trackTitles = response.body.data.items.map(
				(t: { title: string }) => t.title,
			);
			expect(trackTitles).toContain("Album 1 Track 1");
			expect(trackTitles).toContain("Album 1 Track 2");
			expect(trackTitles).not.toContain("Album 2 Track");
		});

		/**
		 * SCENARIO: Returns empty array when no tracks exist
		 * EXPECTATION: 200 OK with empty items array
		 */
		it("should return empty array when no tracks exist (200)", async () => {
			// Act - No tracks created
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toBeInstanceOf(Array);
			expect(response.body.data.items).toHaveLength(0);
			expect(response.body.data.total).toBe(0);
		});

		/**
		 * SCENARIO: Verify artist and album data is populated in response
		 * EXPECTATION: 200 OK with artist (id, name, imageUrl) and album (id, title, coverImageUrl) populated
		 */
		it("should populate artist (id, name, imageUrl) and album (id, title, coverImageUrl) (200)", async () => {
			// Arrange - Create artist and album with specific data
			const artistWithImage = (
				await insertArtists([
					createTestArtist({
						name: "Populated Artist",
						image_url: "https://example.com/artist-photo.jpg",
					}),
				])
			)[0]!;

			const albumWithCover = (
				await insertAlbums([
					createTestAlbum(artistWithImage._id, {
						title: "Populated Album",
						cover_image_url: "https://example.com/album-cover.jpg",
					}),
				])
			)[0]!;

			await insertTracks([
				createTestTrack(artistWithImage._id, albumWithCover._id, {
					title: "Track With Populated Data",
					track_number: 1,
				}),
			]);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(1);

			const track = response.body.data.items[0];

			// Verify artist is populated
			expect(track.artist).toBeDefined();
			expect(track.artist.id || track.artist._id).toBeDefined();
			expect(track.artist.name).toBe("Populated Artist");
			expect(track.artist.imageUrl).toBe(
				"https://example.com/artist-photo.jpg",
			);

			// Verify album is populated
			expect(track.album).toBeDefined();
			expect(track.album.id || track.album._id).toBeDefined();
			expect(track.album.title).toBe("Populated Album");
			expect(track.album.coverImageUrl).toBe(
				"https://example.com/album-cover.jpg",
			);
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
	});

	// ============================================
	// GET /api/tracks/search - Search by Title or Genre
	// ============================================
	describe("GET /api/tracks/search (Search)", () => {
		/**
		 * SCENARIO: Returns tracks matching title prefix
		 * EXPECTATION: 200 OK with matching tracks
		 */
		it("should return tracks matching title prefix (200)", async () => {
			// Arrange
			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Bohemian Rhapsody",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Bohemian Dreams",
					track_number: 2,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Stairway to Heaven",
					track_number: 3,
				}),
			];
			await insertTracks(tracks);

			// Act - Search for "Bohemian"
			const response = await request(app)
				.get(`${API_BASE}/search?q=Bohemian`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);

			// Should match "Bohemian Rhapsody" and "Bohemian Dreams"
			const titles = response.body.data.map((t: { title: string }) => t.title);
			expect(titles).toContain("Bohemian Rhapsody");
			expect(titles).toContain("Bohemian Dreams");
			expect(titles).not.toContain("Stairway to Heaven");
		});

		/**
		 * SCENARIO: Returns tracks matching exact genre
		 * EXPECTATION: 200 OK with matching tracks
		 */
		it("should return tracks matching exact genre (200)", async () => {
			// Arrange
			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Rock Song",
					genre: "rock",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Another Rock",
					genre: "rock",
					track_number: 2,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Jazz Tune",
					genre: "jazz",
					track_number: 3,
				}),
			];
			await insertTracks(tracks);

			// Act - Search for "rock" genre
			const response = await request(app)
				.get(`${API_BASE}/search?q=rock`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);

			// Should match tracks with "rock" genre
			const genres = response.body.data.map((t: { genre: string }) => t.genre);
			genres.forEach((genre: string) => {
				expect(genre.toLowerCase()).toBe("rock");
			});
		});

		/**
		 * SCENARIO: Returns empty array for non-matching query
		 * EXPECTATION: 200 OK with empty array
		 */
		it("should return empty array for non-matching query (200)", async () => {
			// Arrange
			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Track One",
					genre: "rock",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Track Two",
					genre: "pop",
					track_number: 2,
				}),
			];
			await insertTracks(tracks);

			// Act - Search for non-existent title/genre
			const response = await request(app)
				.get(`${API_BASE}/search?q=NonExistentQuery`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data).toHaveLength(0);
		});

		/**
		 * SCENARIO: Limits results to maximum of 5
		 * EXPECTATION: 200 OK with at most 5 results
		 */
		it("should limit results to 5 maximum (200)", async () => {
			// Arrange - Create 10 tracks with "Greatest" in title
			const tracks = Array.from({ length: 10 }, (_, i) =>
				createTestTrack(testArtist._id, testAlbum._id, {
					title: `Greatest Hit ${i + 1}`,
					track_number: i + 1,
					duration_in_seconds: 180 + i,
				}),
			);
			await insertTracks(tracks);

			// Act - Search for "Greatest"
			const response = await request(app)
				.get(`${API_BASE}/search?q=Greatest`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data.length).toBeLessThanOrEqual(5);
		});

		/**
		 * SCENARIO: Returns empty array when query is empty
		 * EXPECTATION: 200 OK with empty array
		 */
		it("should return empty array when query is empty (200)", async () => {
			// Arrange
			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Some Track",
					track_number: 1,
				}),
			];
			await insertTracks(tracks);

			// Act - Empty query
			const response = await request(app)
				.get(`${API_BASE}/search?q=`)
				.set("Authorization", `Bearer ${authToken}`)
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
				.get(`${API_BASE}/search?q=Track`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// GET /api/tracks/:id - Get Single Track
	// ============================================
	describe("GET /api/tracks/:id (Get Single Track)", () => {
		/**
		 * SCENARIO: Returns track by valid ID with populated artist & album
		 * EXPECTATION: 200 OK with track object including artist and album
		 */
		it("should return track by valid ID with populated artist & album (200)", async () => {
			// Arrange - Create artist and album with specific data
			const artistData = createTestArtist({
				name: "Featured Track Artist",
				image_url: "https://example.com/featured-artist.jpg",
			});
			const featuredArtist = (await insertArtists([artistData]))[0]!;

			const albumData = createTestAlbum(featuredArtist._id, {
				title: "Featured Track Album",
				cover_image_url: "https://example.com/featured-album.jpg",
			});
			const featuredAlbum = (await insertAlbums([albumData]))[0]!;

			const trackData = createTestTrack(featuredArtist._id, featuredAlbum._id, {
				title: "Featured Track",
				duration_in_seconds: 300,
				track_number: 5,
				genre: "electronic",
				play_count: 1000,
				cover_image_url: "https://example.com/featured-track.jpg",
			});
			const insertedTracks = await insertTracks([trackData]);
			const createdTrack = insertedTracks[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${createdTrack._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();

			const track = response.body.data;
			expect(track.id || track._id).toBe(createdTrack._id.toString());
			expect(track.title).toBe("Featured Track");
			expect(track.durationInSeconds).toBe(300);
			expect(track.trackNumber).toBe(5);
			expect(track.genre).toBe("electronic");
			expect(track.playCount).toBe(1000);
			expect(track.coverImageUrl).toBe(
				"https://example.com/featured-track.jpg",
			);

			// Verify artist is populated
			expect(track.artist).toBeDefined();
			expect(track.artist.id || track.artist._id).toBeDefined();
			expect(track.artist.name).toBe("Featured Track Artist");
			expect(track.artist.imageUrl).toBe(
				"https://example.com/featured-artist.jpg",
			);

			// Verify album is populated
			expect(track.album).toBeDefined();
			expect(track.album.id || track.album._id).toBeDefined();
			expect(track.album.title).toBe("Featured Track Album");
			expect(track.album.coverImageUrl).toBe(
				"https://example.com/featured-album.jpg",
			);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent ID
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent ID (404)", async () => {
			// Arrange - Valid ObjectId format but doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${nonExistentId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Returns 400 for invalid ObjectId format
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for invalid ObjectId format (400)", async () => {
			// Arrange - Invalid ObjectId
			const invalidId = "not-a-valid-objectid";

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${invalidId}`)
				.set("Authorization", `Bearer ${authToken}`)
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
			const trackData = createTestTrack(testArtist._id, testAlbum._id, {
				title: "Auth Test Track",
			});
			const insertedTracks = await insertTracks([trackData]);
			const createdTrack = insertedTracks[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.get(`${API_BASE}/${createdTrack._id}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// POST /api/tracks/:id/play - Increment Play Count
	// ============================================
	describe("POST /api/tracks/:id/play (Increment Play Count)", () => {
		/**
		 * SCENARIO: Increments play_count and returns updated track
		 * EXPECTATION: 200 OK with updated track having incremented playCount
		 */
		it("should increment play_count and return updated track (200)", async () => {
			// Arrange - Create track with initial play_count of 10
			const trackData = createTestTrack(testArtist._id, testAlbum._id, {
				title: "Playable Track",
				play_count: 10,
				track_number: 1,
			});
			const insertedTracks = await insertTracks([trackData]);
			const createdTrack = insertedTracks[0]!;

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${createdTrack._id}/play`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();

			const track = response.body.data;
			expect(track.playCount).toBe(11);
			expect(track.title).toBe("Playable Track");

			// Verify the change persisted in database
			const dbTrack = await Track.findById(createdTrack._id);
			expect(dbTrack?.play_count).toBe(11);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent ID
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent ID (404)", async () => {
			// Arrange - Valid ObjectId format but doesn't exist
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${nonExistentId}/play`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Returns 400 for invalid ObjectId format
		 * EXPECTATION: 400 Bad Request
		 */
		it("should return 400 Bad Request for invalid ObjectId format (400)", async () => {
			// Arrange - Invalid ObjectId
			const invalidId = "not-a-valid-objectid";

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${invalidId}/play`)
				.set("Authorization", `Bearer ${authToken}`)
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
			const trackData = createTestTrack(testArtist._id, testAlbum._id, {
				title: "Auth Play Test Track",
				play_count: 5,
			});
			const insertedTracks = await insertTracks([trackData]);
			const createdTrack = insertedTracks[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.post(`${API_BASE}/${createdTrack._id}/play`)
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
		 * SCENARIO: Invalid token for paginated list
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for invalid token on GET /api/tracks", async () => {
			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", "Bearer invalid.token.here")
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Invalid token for search
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for invalid token on GET /api/tracks/search", async () => {
			// Act
			const response = await request(app)
				.get(`${API_BASE}/search?q=test`)
				.set("Authorization", "Bearer invalid.token.here")
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Invalid token for get by ID
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for invalid token on GET /api/tracks/:id", async () => {
			// Arrange
			const validId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${validId}`)
				.set("Authorization", "Bearer invalid.token.here")
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Invalid token for play endpoint
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for invalid token on POST /api/tracks/:id/play", async () => {
			// Arrange
			const validId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.post(`${API_BASE}/${validId}/play`)
				.set("Authorization", "Bearer invalid.token.here")
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Filter by non-existent artistId
		 * EXPECTATION: 200 OK with empty array (no tracks match)
		 */
		it("should return empty array when filtering by non-existent artistId (200)", async () => {
			// Arrange - Create tracks for testArtist
			await insertTracks([
				createTestTrack(testArtist._id, testAlbum._id, { title: "Real Track" }),
			]);

			// Non-existent artistId
			const nonExistentArtistId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.get(`${API_BASE}?artistId=${nonExistentArtistId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(0);
			expect(response.body.data.total).toBe(0);
		});

		/**
		 * SCENARIO: Filter by non-existent albumId
		 * EXPECTATION: 200 OK with empty array (no tracks match)
		 */
		it("should return empty array when filtering by non-existent albumId (200)", async () => {
			// Arrange - Create tracks for testAlbum
			await insertTracks([
				createTestTrack(testArtist._id, testAlbum._id, { title: "Real Track" }),
			]);

			// Non-existent albumId
			const nonExistentAlbumId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.get(`${API_BASE}?albumId=${nonExistentAlbumId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(0);
			expect(response.body.data.total).toBe(0);
		});

		/**
		 * SCENARIO: Track response contains all expected fields
		 * EXPECTATION: 200 OK with complete track object
		 */
		it("should return track with all expected fields (200)", async () => {
			// Arrange
			const trackData = createTestTrack(testArtist._id, testAlbum._id, {
				title: "Complete Fields Track",
				duration_in_seconds: 245,
				track_number: 7,
				genre: "indie",
				play_count: 500,
				cover_image_url: "https://example.com/complete-cover.jpg",
			});
			await insertTracks([trackData]);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			const track = response.body.data.items[0];

			// Verify all expected fields
			expect(track.id || track._id).toBeDefined();
			expect(track.title).toBe("Complete Fields Track");
			expect(track.durationInSeconds).toBe(245);
			expect(track.trackNumber).toBe(7);
			expect(track.genre).toBe("indie");
			expect(track.playCount).toBe(500);
			expect(track.coverImageUrl).toBe(
				"https://example.com/complete-cover.jpg",
			);
			expect(track.createdAt).toBeDefined();
			expect(track.updatedAt).toBeDefined();

			// Verify artist and album are populated
			expect(track.artist).toBeDefined();
			expect(track.album).toBeDefined();
		});

		/**
		 * SCENARIO: Malformed Authorization header
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for malformed Authorization header", async () => {
			// Act - Missing "Bearer" prefix
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", authToken)
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
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Multiple play requests should increment each time
		 * EXPECTATION: 200 OK with correctly incremented playCount
		 */
		it("should increment play_count correctly on multiple plays (200)", async () => {
			// Arrange - Create track with initial play_count of 0
			const trackData = createTestTrack(testArtist._id, testAlbum._id, {
				title: "Multi-Play Track",
				play_count: 0,
				track_number: 1,
			});
			const insertedTracks = await insertTracks([trackData]);
			const createdTrack = insertedTracks[0]!;

			// Act - Play 3 times
			await request(app)
				.post(`${API_BASE}/${createdTrack._id}/play`)
				.set("Authorization", `Bearer ${authToken}`);

			await request(app)
				.post(`${API_BASE}/${createdTrack._id}/play`)
				.set("Authorization", `Bearer ${authToken}`);

			const response = await request(app)
				.post(`${API_BASE}/${createdTrack._id}/play`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.playCount).toBe(3);
		});

		/**
		 * SCENARIO: Combining multiple filters (genre + artistId)
		 * EXPECTATION: 200 OK with tracks matching all filters
		 */
		it("should filter by multiple parameters (genre + artistId) (200)", async () => {
			// Arrange - Create two artists with tracks of different genres
			const secondArtist = (
				await insertArtists([
					createTestArtist({ name: "Genre Test Artist" }),
				])
			)[0]!;

			const tracks = [
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Rock by Artist 1",
					genre: "rock",
					track_number: 1,
				}),
				createTestTrack(testArtist._id, testAlbum._id, {
					title: "Jazz by Artist 1",
					genre: "jazz",
					track_number: 2,
				}),
				createTestTrack(secondArtist._id, testAlbum._id, {
					title: "Rock by Artist 2",
					genre: "rock",
					track_number: 3,
				}),
			];
			await insertTracks(tracks);

			// Act - Filter by genre=rock AND artistId=testArtist
			const response = await request(app)
				.get(`${API_BASE}?genre=rock&artistId=${testArtist._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(1);
			expect(response.body.data.items[0].title).toBe("Rock by Artist 1");
		});

		/**
		 * SCENARIO: Custom pagination parameters
		 * EXPECTATION: 200 OK with specified pagination
		 */
		it("should respect custom page and limit parameters (200)", async () => {
			// Arrange - Create 15 tracks
			const tracks = Array.from({ length: 15 }, (_, i) =>
				createTestTrack(testArtist._id, testAlbum._id, {
					title: `Track ${i + 1}`,
					track_number: i + 1,
					duration_in_seconds: 180 + i,
				}),
			);
			await insertTracks(tracks);

			// Act - Request page 2 with limit 5
			const response = await request(app)
				.get(`${API_BASE}?page=2&limit=5`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(5);
			expect(response.body.data.page).toBe(2);
			expect(response.body.data.limit).toBe(5);
			expect(response.body.data.total).toBe(15);
			expect(response.body.data.totalPages).toBe(3);
		});
	});
});
