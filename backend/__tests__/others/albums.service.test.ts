/**
 * INTRO: Album Service Integration Tests
 *
 * Tests album endpoints: list (paginated with artistId filter), search, get by ID
 * Uses real MongoDB test database for integration testing.
 * These tests follow TDD approach - written BEFORE implementation.
 *
 * Test Coverage:
 * - GET /api/albums: Paginated list sorted by releaseDate desc, optional artistId filter
 * - GET /api/albums/search: Text search by title, max 5 results
 * - GET /api/albums/:id: Get single album with populated artist (name, imageUrl)
 *
 * Album Schema:
 * - title: String (required, trim)
 * - artistId: ObjectId (ref: Artist, required)
 * - release_date: Date (required)
 * - cover_image_url: String (optional, uses cover_image_url in DB)
 * - total_tracks: Number (required, min: 1)
 * - timestamps: createdAt, updatedAt
 *
 * Indexes:
 * - Text index on `title` (for full-text search)
 * - Ascending index on `artist_id`
 * - Descending index on `release_date`
 *
 * Response Format:
 * - Success: { success: true, data: {...} }
 * - Error: { success: false, error: "message" }
 * - Paginated: { success: true, data: { items: [...], total, page, limit, totalPages } }
 *
 * Album Response Fields:
 * - id, title, releaseDate, coverImageUrl, totalTracks, createdAt, updatedAt
 * - artist: { id, name, imageUrl } (populated from artistId)
 */

import * as dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../src/app";
import { loadConfig, Config } from "../../src/shared/config";
import { Artist, IArtistDocument } from "../../src/features/artists/artist.model";

// Load test configuration (appends _test to database name)
const config: Config = loadConfig(true);
const API_BASE = "/api/albums";
const AUTH_BASE = "/api/auth";

// ============================================
// Album Model Definition (for tests only - TDD approach)
// Uses snake_case for DB fields, matching the actual implementation
// ============================================
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
		release_date: {
			type: Date,
			required: true,
		},
		cover_image_url: {
			type: String,
		},
		total_tracks: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

// Create text index on title for search functionality
albumSchema.index({ title: "text" });
// Create ascending index on artist_id
albumSchema.index({ artist_id: 1 });
// Create descending index on release_date for sorting
albumSchema.index({ release_date: -1 });

// Use existing model if available, otherwise create new one
const Album: Model<IAlbumDocument> =
	mongoose.models["Album"] ||
	mongoose.model<IAlbumDocument>("Album", albumSchema, "albums");

// ============================================
// Test Data Factories
// ============================================

/**
 * Create a test album with optional overrides
 * Uses snake_case for DB fields
 */
const createTestAlbum = (
	artist_id: mongoose.Types.ObjectId,
	overrides: Partial<Omit<IAlbum, "artist_id">> = {},
): Partial<IAlbum> => ({
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
	email: "albumtestuser@example.com",
	username: "albumtestuser",
	password: "Password123!",
	displayName: "Album Test User",
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
	albums: Partial<IAlbum>[],
): Promise<IAlbumDocument[]> => {
	const result = await Album.insertMany(albums);
	return result as IAlbumDocument[];
};

describe("Album Service", () => {
	let app: Application;
	let authToken: string;
	let testArtist: IArtistDocument;

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(config.mongodbUri);

		// Create Express app
		app = createApp();

		// Ensure indexes are created
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

		// Create a default test artist for album tests
		const artistData = createTestArtist({ name: "Default Test Artist" });
		const insertedArtists = await insertArtists([artistData]);
		testArtist = insertedArtists[0]!;
	});

	// ============================================
	// 3.1 GET /api/albums - Paginated List with Artist Filter
	// ============================================
	describe("GET /api/albums (Paginated List + Artist Filter)", () => {
		/**
		 * SCENARIO: Returns paginated albums sorted by releaseDate descending
		 * EXPECTATION: 200 OK with albums sorted by releaseDate desc
		 */
		it("should return paginated albums sorted by releaseDate descending (200)", async () => {
			// Arrange - Create albums with different release dates
			const albums = [
				createTestAlbum(testArtist._id, {
					title: "Old Album",
					release_date: new Date("2020-01-01"),
				}),
				createTestAlbum(testArtist._id, {
					title: "New Album",
					release_date: new Date("2024-06-15"),
				}),
				createTestAlbum(testArtist._id, {
					title: "Mid Album",
					release_date: new Date("2022-06-15"),
				}),
			];
			await insertAlbums(albums);

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

			// Verify sorting by releaseDate descending (newest first)
			const items = response.body.data.items;
			expect(items[0].title).toBe("New Album");
			expect(items[1].title).toBe("Mid Album");
			expect(items[2].title).toBe("Old Album");

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
			// Arrange - Create 25 albums
			const albums = Array.from({ length: 25 }, (_, i) =>
				createTestAlbum(testArtist._id, {
					title: `Album ${i + 1}`,
					release_date: new Date(2020, 0, i + 1), // Sequential dates
					total_tracks: i + 1,
				}),
			);
			await insertAlbums(albums);

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
		 * SCENARIO: Respects custom page and limit parameters
		 * EXPECTATION: 200 OK with specified pagination
		 */
		it("should respect custom page and limit parameters (200)", async () => {
			// Arrange - Create 15 albums
			const albums = Array.from({ length: 15 }, (_, i) =>
				createTestAlbum(testArtist._id, {
					title: `Album ${i + 1}`,
					release_date: new Date(2020, 0, 15 - i), // Descending order by date
					total_tracks: i + 1,
				}),
			);
			await insertAlbums(albums);

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

		/**
		 * SCENARIO: Filters albums by artistId when provided
		 * EXPECTATION: 200 OK with only albums by the specified artist
		 */
		it("should filter albums by artistId when provided (200)", async () => {
			// Arrange - Create two artists and albums for each
			const secondArtist = (
				await insertArtists([
					createTestArtist({ name: "Second Artist", follower_count: 500 }),
				])
			)[0]!;

			const albums = [
				createTestAlbum(testArtist._id, {
					title: "First Artist Album 1",
					release_date: new Date("2023-01-01"),
				}),
				createTestAlbum(testArtist._id, {
					title: "First Artist Album 2",
					release_date: new Date("2023-06-01"),
				}),
				createTestAlbum(secondArtist._id, {
					title: "Second Artist Album",
					release_date: new Date("2023-03-01"),
				}),
			];
			await insertAlbums(albums);

			// Act - Filter by testArtist's ID
			const response = await request(app)
				.get(`${API_BASE}?artistId=${testArtist._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items).toHaveLength(2);

			// Verify all returned albums belong to the specified artist
			const albumTitles = response.body.data.items.map(
				(a: { title: string }) => a.title,
			);
			expect(albumTitles).toContain("First Artist Album 1");
			expect(albumTitles).toContain("First Artist Album 2");
			expect(albumTitles).not.toContain("Second Artist Album");
		});

		/**
		 * SCENARIO: Returns empty array when no albums exist
		 * EXPECTATION: 200 OK with empty items array
		 */
		it("should return empty array when no albums exist (200)", async () => {
			// Act - No albums created
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
		 * SCENARIO: Verify artist data is populated in response
		 * EXPECTATION: 200 OK with artist (id, name, imageUrl) populated
		 */
		it("should populate artist data (name, imageUrl) in response (200)", async () => {
			// Arrange - Create artist with specific data and an album
			const artistWithImage = (
				await insertArtists([
					createTestArtist({
						name: "Artist With Image",
						image_url: "https://example.com/artist-photo.jpg",
					}),
				])
			)[0]!;

			await insertAlbums([
				createTestAlbum(artistWithImage._id, {
					title: "Album With Populated Artist",
					release_date: new Date("2024-01-01"),
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

			const album = response.body.data.items[0];
			expect(album.artist).toBeDefined();
			expect(album.artist.id || album.artist._id).toBeDefined();
			expect(album.artist.name).toBe("Artist With Image");
			expect(album.artist.imageUrl).toBe(
				"https://example.com/artist-photo.jpg",
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
	// 3.2 GET /api/albums/search - Text Search
	// ============================================
	describe("GET /api/albums/search (Text Search)", () => {
		/**
		 * SCENARIO: Returns albums matching search query
		 * EXPECTATION: 200 OK with matching albums
		 */
		it("should return albums matching search query (200)", async () => {
			// Arrange
			const albums = [
				createTestAlbum(testArtist._id, {
					title: "Thriller",
					release_date: new Date("1982-11-30"),
				}),
				createTestAlbum(testArtist._id, {
					title: "Thriller Night Edition",
					release_date: new Date("2008-02-08"),
				}),
				createTestAlbum(testArtist._id, {
					title: "Abbey Road",
					release_date: new Date("1969-09-26"),
				}),
			];
			await insertAlbums(albums);

			// Act - Search for "Thriller"
			const response = await request(app)
				.get(`${API_BASE}/search?q=Thriller`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);

			// Should match "Thriller" and "Thriller Night Edition"
			const titles = response.body.data.map((a: { title: string }) => a.title);
			expect(titles).toContain("Thriller");
			expect(titles).toContain("Thriller Night Edition");
			expect(titles).not.toContain("Abbey Road");
		});

		/**
		 * SCENARIO: Returns empty array for non-matching query
		 * EXPECTATION: 200 OK with empty array
		 */
		it("should return empty array for non-matching query (200)", async () => {
			// Arrange
			const albums = [
				createTestAlbum(testArtist._id, {
					title: "Album One",
					release_date: new Date("2020-01-01"),
				}),
				createTestAlbum(testArtist._id, {
					title: "Album Two",
					release_date: new Date("2021-01-01"),
				}),
			];
			await insertAlbums(albums);

			// Act - Search for non-existent title
			const response = await request(app)
				.get(`${API_BASE}/search?q=NonExistentAlbumTitle`)
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
			// Arrange - Create 10 albums with "Greatest" in title
			const albums = Array.from({ length: 10 }, (_, i) =>
				createTestAlbum(testArtist._id, {
					title: `Greatest Hits Vol ${i + 1}`,
					release_date: new Date(2020, 0, i + 1),
					total_tracks: i + 5,
				}),
			);
			await insertAlbums(albums);

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
			const albums = [
				createTestAlbum(testArtist._id, {
					title: "Some Album",
					release_date: new Date("2023-01-01"),
				}),
			];
			await insertAlbums(albums);

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
				.get(`${API_BASE}/search?q=Album`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 3.3 GET /api/albums/:id - Get Single Album
	// ============================================
	describe("GET /api/albums/:id (Get Single Album)", () => {
		/**
		 * SCENARIO: Returns album by valid ID with populated artist
		 * EXPECTATION: 200 OK with album object including artist (id, name, imageUrl)
		 */
		it("should return album by valid ID with populated artist (200)", async () => {
			// Arrange - Create artist with specific data
			const artistData = createTestArtist({
				name: "Featured Artist",
				image_url: "https://example.com/featured-artist.jpg",
			});
			const featuredArtist = (await insertArtists([artistData]))[0]!;

			const albumData = createTestAlbum(featuredArtist._id, {
				title: "Featured Album",
				release_date: new Date("2024-03-15"),
				cover_image_url: "https://example.com/featured-cover.jpg",
				total_tracks: 14,
			});
			const insertedAlbums = await insertAlbums([albumData]);
			const createdAlbum = insertedAlbums[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${createdAlbum._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();

			const album = response.body.data;
			expect(album.id || album._id).toBe(createdAlbum._id.toString());
			expect(album.title).toBe("Featured Album");
			expect(album.totalTracks).toBe(14);
			expect(album.coverImageUrl).toBe(
				"https://example.com/featured-cover.jpg",
			);

			// Verify artist is populated
			expect(album.artist).toBeDefined();
			expect(album.artist.id || album.artist._id).toBeDefined();
			expect(album.artist.name).toBe("Featured Artist");
			expect(album.artist.imageUrl).toBe(
				"https://example.com/featured-artist.jpg",
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
			const albumData = createTestAlbum(testArtist._id, {
				title: "Auth Test Album",
			});
			const insertedAlbums = await insertAlbums([albumData]);
			const createdAlbum = insertedAlbums[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.get(`${API_BASE}/${createdAlbum._id}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	// ============================================
	// 3.4 Edge Cases and Error Handling
	// ============================================
	describe("Edge Cases and Error Handling", () => {
		/**
		 * SCENARIO: Invalid token for paginated list
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for invalid token on GET /api/albums", async () => {
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
		it("should return 401 for invalid token on GET /api/albums/search", async () => {
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
		it("should return 401 for invalid token on GET /api/albums/:id", async () => {
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
		 * SCENARIO: Filter by non-existent artistId
		 * EXPECTATION: 200 OK with empty array (no albums match)
		 */
		it("should return empty array when filtering by non-existent artistId (200)", async () => {
			// Arrange - Create albums for testArtist
			await insertAlbums([
				createTestAlbum(testArtist._id, { title: "Real Album" }),
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
		 * SCENARIO: Album response contains all expected fields
		 * EXPECTATION: 200 OK with complete album object
		 */
		it("should return album with all expected fields (200)", async () => {
			// Arrange
			const albumData = createTestAlbum(testArtist._id, {
				title: "Complete Fields Album",
				release_date: new Date("2024-05-20"),
				cover_image_url: "https://example.com/complete-cover.jpg",
				total_tracks: 18,
			});
			await insertAlbums([albumData]);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			const album = response.body.data.items[0];

			// Verify all expected fields
			expect(album.id || album._id).toBeDefined();
			expect(album.title).toBe("Complete Fields Album");
			expect(album.releaseDate).toBeDefined();
			expect(album.coverImageUrl).toBe(
				"https://example.com/complete-cover.jpg",
			);
			expect(album.totalTracks).toBe(18);
			expect(album.createdAt).toBeDefined();
			expect(album.updatedAt).toBeDefined();

			// Verify artist is populated
			expect(album.artist).toBeDefined();
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
		 * SCENARIO: Search is case-insensitive
		 * EXPECTATION: 200 OK with matching albums regardless of case
		 */
		it("should perform case-insensitive search (200)", async () => {
			// Arrange
			const albums = [
				createTestAlbum(testArtist._id, {
					title: "DARK SIDE OF THE MOON",
					release_date: new Date("1973-03-01"),
				}),
				createTestAlbum(testArtist._id, {
					title: "Dark Matter",
					release_date: new Date("2024-01-01"),
				}),
			];
			await insertAlbums(albums);

			// Act - Search with lowercase
			const response = await request(app)
				.get(`${API_BASE}/search?q=dark`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
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
	});
});
