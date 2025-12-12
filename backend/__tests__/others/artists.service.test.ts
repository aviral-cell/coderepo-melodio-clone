/**
 * INTRO: Artist Service Integration Tests
 *
 * Tests artist endpoints: list (paginated), search, get by ID
 * Uses real MongoDB test database for integration testing.
 * These tests follow TDD approach - written BEFORE implementation.
 *
 * Test Coverage:
 * - GET /api/artists: Paginated list sorted by followerCount desc
 * - GET /api/artists/search: Text search by name
 * - GET /api/artists/:id: Get single artist by ID
 *
 * Artist Schema:
 * - name: String (required, trim)
 * - bio: String (optional, trim)
 * - imageUrl: String (optional)
 * - genres: String[] (required, default: [])
 * - followerCount: Number (optional, min: 0, default: 0)
 * - timestamps: createdAt, updatedAt
 *
 * Indexes:
 * - Text index on `name` (for full-text search)
 * - Descending index on `followerCount`
 */

import * as dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../src/app";
import { loadConfig, Config } from "../../src/shared/config";

// Load test configuration (appends _test to database name)
const config: Config = loadConfig(true);
const API_BASE = "/api/artists";
const AUTH_BASE = "/api/auth";

// ============================================
// Artist Model Definition (for tests only - TDD approach)
// Uses snake_case for DB fields, matching the actual implementation
// ============================================
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
		name: {
			type: String,
			required: true,
			trim: true,
		},
		bio: {
			type: String,
			trim: true,
		},
		image_url: {
			type: String,
		},
		genres: {
			type: [String],
			required: true,
			default: [],
		},
		follower_count: {
			type: Number,
			min: 0,
			default: 0,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

// Create text index on name for search functionality
artistSchema.index({ name: "text" });
// Create descending index on follower_count for sorting
artistSchema.index({ follower_count: -1 });

// Use existing model if available, otherwise create new one
const Artist: Model<IArtistDocument> =
	mongoose.models["Artist"] ||
	mongoose.model<IArtistDocument>("Artist", artistSchema, "artists");

// ============================================
// Test Data Factories
// ============================================

/**
 * Create a test artist with optional overrides
 * Uses snake_case for DB fields
 */
const createTestArtist = (overrides: Partial<IArtist> = {}): Partial<IArtist> => ({
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
	email: "artisttestuser@example.com",
	username: "artisttestuser",
	password: "Password123!",
	displayName: "Artist Test User",
	...overrides,
});

/**
 * Insert multiple artists into the database
 */
const insertArtists = async (
	artists: Partial<IArtist>[],
): Promise<mongoose.Document[]> => {
	return await Artist.insertMany(artists);
};

describe("Artist Service", () => {
	let app: Application;
	let authToken: string;

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(config.mongodbUri);

		// Create Express app
		app = createApp();

		// Ensure text index is created
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
	});

	// ============================================
	// 2.1 GET /api/artists - Paginated List
	// ============================================
	describe("GET /api/artists (Paginated List)", () => {
		/**
		 * SCENARIO: Returns paginated artists sorted by followerCount descending
		 * EXPECTATION: 200 OK with artists sorted by followerCount desc
		 */
		it("should return paginated artists sorted by followerCount descending (200)", async () => {
			// Arrange - Create artists with different follower counts
			const artists = [
				createTestArtist({ name: "Low Followers", follower_count: 100 }),
				createTestArtist({ name: "High Followers", follower_count: 10000 }),
				createTestArtist({ name: "Medium Followers", follower_count: 5000 }),
			];
			await insertArtists(artists);

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

			// Verify sorting by followerCount descending
			const items = response.body.data.items;
			expect(items[0].name).toBe("High Followers");
			expect(items[0].followerCount).toBe(10000);
			expect(items[1].name).toBe("Medium Followers");
			expect(items[1].followerCount).toBe(5000);
			expect(items[2].name).toBe("Low Followers");
			expect(items[2].followerCount).toBe(100);

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
			// Arrange - Create 25 artists
			const artists = Array.from({ length: 25 }, (_, i) =>
				createTestArtist({
					name: `Artist ${i + 1}`,
					follower_count: i * 100,
				}),
			);
			await insertArtists(artists);

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
			// Arrange - Create 15 artists
			const artists = Array.from({ length: 15 }, (_, i) =>
				createTestArtist({
					name: `Artist ${i + 1}`,
					follower_count: (15 - i) * 100, // Descending follower count
				}),
			);
			await insertArtists(artists);

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
		 * SCENARIO: Enforces maximum limit of 50
		 * EXPECTATION: 200 OK with limit capped at 50
		 */
		it("should cap limit at maximum of 50 (200)", async () => {
			// Arrange - Create 60 artists
			const artists = Array.from({ length: 60 }, (_, i) =>
				createTestArtist({
					name: `Artist ${i + 1}`,
					follower_count: i * 100,
				}),
			);
			await insertArtists(artists);

			// Act - Request with limit > 50
			const response = await request(app)
				.get(`${API_BASE}?limit=100`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.items.length).toBeLessThanOrEqual(50);
			expect(response.body.data.limit).toBeLessThanOrEqual(50);
		});

		/**
		 * SCENARIO: Returns empty array when no artists exist
		 * EXPECTATION: 200 OK with empty items array
		 */
		it("should return empty array when no artists exist (200)", async () => {
			// Act - No artists created
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
		 * SCENARIO: Verify artist response contains expected fields
		 * EXPECTATION: 200 OK with all artist fields present
		 */
		it("should return artist with all expected fields (200)", async () => {
			// Arrange
			const artistData = createTestArtist({
				name: "Complete Artist",
				bio: "A complete bio",
				image_url: "https://example.com/image.jpg",
				genres: ["Jazz", "Blues"],
				follower_count: 5000,
			});
			await insertArtists([artistData]);

			// Act
			const response = await request(app)
				.get(API_BASE)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			const artist = response.body.data.items[0];
			expect(artist.name).toBe("Complete Artist");
			expect(artist.bio).toBe("A complete bio");
			expect(artist.imageUrl).toBe("https://example.com/image.jpg");
			expect(artist.genres).toEqual(["Jazz", "Blues"]);
			expect(artist.followerCount).toBe(5000);
			expect(artist._id).toBeDefined();
			expect(artist.createdAt).toBeDefined();
			expect(artist.updatedAt).toBeDefined();
		});
	});

	// ============================================
	// 2.2 GET /api/artists/search - Text Search
	// ============================================
	describe("GET /api/artists/search (Text Search)", () => {
		/**
		 * SCENARIO: Returns artists matching search query
		 * EXPECTATION: 200 OK with matching artists
		 */
		it("should return artists matching search query (200)", async () => {
			// Arrange
			const artists = [
				createTestArtist({ name: "John Lennon", follower_count: 1000 }),
				createTestArtist({ name: "Johnny Cash", follower_count: 2000 }),
				createTestArtist({ name: "Elvis Presley", follower_count: 3000 }),
			];
			await insertArtists(artists);

			// Act - Search for "John"
			const response = await request(app)
				.get(`${API_BASE}/search?q=John`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);

			// Should match "John Lennon" and "Johnny Cash"
			const names = response.body.data.map((a: IArtist) => a.name);
			expect(names).toContain("John Lennon");
			expect(names).toContain("Johnny Cash");
			expect(names).not.toContain("Elvis Presley");
		});

		/**
		 * SCENARIO: Returns empty array for non-matching query
		 * EXPECTATION: 200 OK with empty array
		 */
		it("should return empty array for non-matching query (200)", async () => {
			// Arrange
			const artists = [
				createTestArtist({ name: "Artist One", follower_count: 1000 }),
				createTestArtist({ name: "Artist Two", follower_count: 2000 }),
			];
			await insertArtists(artists);

			// Act - Search for non-existent name
			const response = await request(app)
				.get(`${API_BASE}/search?q=NonExistentArtist`)
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
			// Arrange - Create 10 artists with "Popular" in name
			const artists = Array.from({ length: 10 }, (_, i) =>
				createTestArtist({
					name: `Popular Artist ${i + 1}`,
					follower_count: i * 100,
				}),
			);
			await insertArtists(artists);

			// Act - Search for "Popular"
			const response = await request(app)
				.get(`${API_BASE}/search?q=Popular`)
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
			const artists = [
				createTestArtist({ name: "Artist One", follower_count: 1000 }),
			];
			await insertArtists(artists);

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
		 * SCENARIO: Returns empty array when query parameter is missing
		 * EXPECTATION: 200 OK with empty array
		 */
		it("should return empty array when query parameter is missing (200)", async () => {
			// Arrange
			const artists = [
				createTestArtist({ name: "Artist One", follower_count: 1000 }),
			];
			await insertArtists(artists);

			// Act - No query parameter
			const response = await request(app)
				.get(`${API_BASE}/search`)
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
				.get(`${API_BASE}/search?q=Artist`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Search is case-insensitive
		 * EXPECTATION: 200 OK with matching artists regardless of case
		 */
		it("should perform case-insensitive search (200)", async () => {
			// Arrange
			const artists = [
				createTestArtist({ name: "METALLICA", follower_count: 1000 }),
				createTestArtist({ name: "Metallica Fan", follower_count: 500 }),
			];
			await insertArtists(artists);

			// Act - Search with lowercase
			const response = await request(app)
				.get(`${API_BASE}/search?q=metallica`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
		});
	});

	// ============================================
	// 2.3 GET /api/artists/:id - Get Single Artist
	// ============================================
	describe("GET /api/artists/:id (Get Single Artist)", () => {
		/**
		 * SCENARIO: Returns artist by valid ID
		 * EXPECTATION: 200 OK with artist object
		 */
		it("should return artist by valid ID (200)", async () => {
			// Arrange
			const artistData = createTestArtist({
				name: "Single Artist",
				bio: "Bio for single artist",
				genres: ["Classical"],
				follower_count: 7500,
			});
			const insertedArtists = await insertArtists([artistData]);
			const createdArtist = insertedArtists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${createdArtist._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data._id).toBe(createdArtist._id.toString());
			expect(response.body.data.name).toBe("Single Artist");
			expect(response.body.data.bio).toBe("Bio for single artist");
			expect(response.body.data.genres).toEqual(["Classical"]);
			expect(response.body.data.followerCount).toBe(7500);
		});

		/**
		 * SCENARIO: Returns 404 for non-existent ID
		 * EXPECTATION: 404 Not Found
		 */
		it("should return 404 Not Found for non-existent ID", async () => {
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
		it("should return 400 Bad Request for invalid ObjectId format", async () => {
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
		 * SCENARIO: Returns 400 for short invalid ID
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
		 * SCENARIO: Request without authentication token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Arrange
			const artistData = createTestArtist({ name: "Auth Test Artist" });
			const insertedArtists = await insertArtists([artistData]);
			const createdArtist = insertedArtists[0]!;

			// Act - No Authorization header
			const response = await request(app)
				.get(`${API_BASE}/${createdArtist._id}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Verify all fields are returned for single artist
		 * EXPECTATION: 200 OK with complete artist object
		 */
		it("should return artist with all fields including timestamps (200)", async () => {
			// Arrange
			const artistData = createTestArtist({
				name: "Complete Fields Artist",
				bio: "Full bio text",
				image_url: "https://example.com/complete.jpg",
				genres: ["Rock", "Alternative", "Indie"],
				follower_count: 12000,
			});
			const insertedArtists = await insertArtists([artistData]);
			const createdArtist = insertedArtists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${createdArtist._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			const artist = response.body.data;
			expect(artist._id).toBeDefined();
			expect(artist.name).toBe("Complete Fields Artist");
			expect(artist.bio).toBe("Full bio text");
			expect(artist.imageUrl).toBe("https://example.com/complete.jpg");
			expect(artist.genres).toEqual(["Rock", "Alternative", "Indie"]);
			expect(artist.followerCount).toBe(12000);
			expect(artist.createdAt).toBeDefined();
			expect(artist.updatedAt).toBeDefined();
		});

		/**
		 * SCENARIO: Artist without optional fields
		 * EXPECTATION: 200 OK with only required fields
		 */
		it("should return artist without optional fields correctly (200)", async () => {
			// Arrange - Artist with only required fields
			const minimalArtist = {
				name: "Minimal Artist",
				genres: ["Pop"],
			};
			const insertedArtists = await insertArtists([minimalArtist]);
			const createdArtist = insertedArtists[0]!;

			// Act
			const response = await request(app)
				.get(`${API_BASE}/${createdArtist._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			const artist = response.body.data;
			expect(artist.name).toBe("Minimal Artist");
			expect(artist.genres).toEqual(["Pop"]);
			expect(artist.followerCount).toBe(0); // Default value
			// bio and imageUrl may be undefined or not present
		});
	});

	// ============================================
	// 2.4 Edge Cases and Error Handling
	// ============================================
	describe("Edge Cases and Error Handling", () => {
		/**
		 * SCENARIO: Invalid token for paginated list
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 for invalid token on GET /api/artists", async () => {
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
		it("should return 401 for invalid token on GET /api/artists/search", async () => {
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
		it("should return 401 for invalid token on GET /api/artists/:id", async () => {
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
		 * SCENARIO: Page parameter is negative
		 * EXPECTATION: Should default to page 1 or return 400
		 */
		it("should handle negative page parameter gracefully", async () => {
			// Arrange
			await insertArtists([createTestArtist({ name: "Test" })]);

			// Act
			const response = await request(app)
				.get(`${API_BASE}?page=-1`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert - Either defaults to page 1 or returns error
			expect([200, 400]).toContain(response.status);
			if (response.status === 200) {
				expect(response.body.data.page).toBeGreaterThanOrEqual(1);
			}
		});

		/**
		 * SCENARIO: Limit parameter is zero
		 * EXPECTATION: Should use default limit or return validation error
		 */
		it("should handle zero limit parameter gracefully", async () => {
			// Arrange
			await insertArtists([createTestArtist({ name: "Test" })]);

			// Act
			const response = await request(app)
				.get(`${API_BASE}?limit=0`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert - Either uses default limit or returns error
			expect([200, 400]).toContain(response.status);
			if (response.status === 200) {
				expect(response.body.data.limit).toBeGreaterThan(0);
			}
		});

		/**
		 * SCENARIO: Non-numeric page parameter
		 * EXPECTATION: Should default to page 1 or return 400
		 */
		it("should handle non-numeric page parameter", async () => {
			// Arrange
			await insertArtists([createTestArtist({ name: "Test" })]);

			// Act
			const response = await request(app)
				.get(`${API_BASE}?page=abc`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect([200, 400]).toContain(response.status);
			if (response.status === 200) {
				expect(response.body.data.page).toBe(1);
			}
		});
	});
});
