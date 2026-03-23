/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";
import { User } from "../../backend/src/features/users/user.model";
import { Artist, IArtistDocument } from "../../backend/src/features/artists/artist.model";
import { ArtistFollow } from "../../backend/src/features/artists/artist-follow.model";
import { ArtistRating } from "../../backend/src/features/artists/artist-rating.model";

const config: Config = loadConfig(true);

const ARTIST_API_BASE = "/api/artists";
const AUTH_API_BASE = "/api/auth";

let app: Application;

let testArtist: IArtistDocument;

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@melodio.com`;
}

async function registerAndLoginUser(userData: {
	email: string;
	username: string;
	password: string;
	displayName: string;
}): Promise<{ token: string; userId: string }> {
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

describe("Artist Interaction", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		app = createApp();

		testArtist = await Artist.create({
			name: "Test Artist for Interactions",
			image_url: "/test-artist.jpg",
			bio: "Test bio",
			genres: ["rock"],
			follower_count: 0,
		});
	});

	afterAll(async () => {
		await ArtistRating.deleteMany({});
		await ArtistFollow.deleteMany({});
		await Artist.deleteMany({});
		await User.deleteMany({});
		await mongoose.disconnect();
	});

	let authToken: string;

	beforeEach(async () => {
		await ArtistFollow.deleteMany({});
		await ArtistRating.deleteMany({});
		await Artist.findByIdAndUpdate(testArtist._id, { $set: { follower_count: 0 } });

		const testUserData = {
			email: generateUniqueEmail("artist-test"),
			username: `artisttest_${Date.now()}`,
			password: "Password123!",
			displayName: "Artist Test User",
		};
		const result = await registerAndLoginUser(testUserData);
		authToken = result.token;
	});

	it("should toggle follow and update follower count", async () => {
		// Follow the artist
		const followRes = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify follow applied
		expect(followRes.status).toBe(200);
		expect(followRes.body.success).toBe(true);
		expect(followRes.body.data.isFollowing).toBe(true);
		expect(followRes.body.data.followerCount).toBe(1);

		// Toggle to unfollow
		const unfollowRes = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify unfollow applied
		expect(unfollowRes.status).toBe(200);
		expect(unfollowRes.body.success).toBe(true);
		expect(unfollowRes.body.data.isFollowing).toBe(false);
		expect(unfollowRes.body.data.followerCount).toBe(0);
	});

	it("should accept minimum half-star rating (0.5)", async () => {
		// Submit rating at the minimum boundary
		const response = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 0.5 });

		// Verify 0.5 rating is accepted
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.userRating).toBe(0.5);
	});

	it("should accept whole number rating (4)", async () => {
		// Submit rating
		const response = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 4 });

		// Verify rating stored and average computed
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.userRating).toBe(4);
		expect(response.body.data.averageRating).toBe(4);
		expect(response.body.data.totalRatings).toBe(1);
	});

	it("should reject rating greater than 5", async () => {
		// Submit rating above the maximum (6 > 5)
		const response = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 6 });

		// Verify rating is rejected
		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.error).toMatch(/rating/i);
	});

	it("should reject rating not in 0.5 increments", async () => {
		// Submit rating not aligned to 0.5 increments (3.3)
		const response = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 3.3 });

		// Verify rating is rejected
		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.error).toMatch(/rating/i);
	});

	it("should update rating on re-rate", async () => {
		// Submit initial rating
		await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 3 });

		// Update to new rating
		const response = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 4.5 });

		// Verify updated rating with count unchanged
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.userRating).toBe(4.5);
		expect(response.body.data.averageRating).toBe(4.5);
		expect(response.body.data.totalRatings).toBe(1);
	});

	it("should compute correct average with multiple users", async () => {
		// First user rates 4
		await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 4 });

		// Register a second user
		const secondUserData = {
			email: generateUniqueEmail("artist-rate-second"),
			username: `artistrate2_${Date.now()}`,
			password: "Password123!",
			displayName: "Second Rate User",
		};
		const { token: secondToken } = await registerAndLoginUser(secondUserData);

		// Second user rates 2
		const response = await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${secondToken}`)
			.send({ rating: 2 });

		// Verify average is (4+2)/2 = 3
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.userRating).toBe(2);
		expect(response.body.data.averageRating).toBe(3);
		expect(response.body.data.totalRatings).toBe(2);
	});

	it("should return default interaction state for new user", async () => {
		// Fetch interaction state without any prior interactions
		const response = await request(app)
			.get(`${ARTIST_API_BASE}/${testArtist._id}/interaction`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify all defaults are zero/false
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.isFollowing).toBe(false);
		expect(response.body.data.userRating).toBe(0);
		expect(response.body.data.averageRating).toBe(0);
		expect(response.body.data.totalRatings).toBe(0);
	});

	it("should return follow and rating via interaction endpoint", async () => {
		// Follow the artist
		await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/follow`)
			.set("Authorization", `Bearer ${authToken}`);

		// Rate the artist
		await request(app)
			.post(`${ARTIST_API_BASE}/${testArtist._id}/rate`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ rating: 3.5 });

		// Fetch combined interaction state
		const response = await request(app)
			.get(`${ARTIST_API_BASE}/${testArtist._id}/interaction`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify follow and rating reflected
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.isFollowing).toBe(true);
		expect(response.body.data.userRating).toBe(3.5);
		expect(response.body.data.averageRating).toBe(3.5);
		expect(response.body.data.totalRatings).toBe(1);
	});
});
