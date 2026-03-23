import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import request from "supertest";
import mongoose from "mongoose";
import { Application } from "express";
import { createApp } from "../../src/app";
import { loadConfig, Config } from "../../src/shared/config";
import { User } from "../../src/features/users/user.model";
import { Artist, IArtistDocument } from "../../src/features/artists/artist.model";
import { Album, IAlbumDocument } from "../../src/features/albums/album.model";
import { Track, ITrackDocument } from "../../src/features/tracks/track.model";
import { TrackLike } from "../../src/features/tracks/track-like.model";

const config: Config = loadConfig(true);

const TRACKS_API_BASE = "/api/tracks";
const AUTH_API_BASE = "/api/auth";

let app: Application;

let testArtist: IArtistDocument;
let testAlbum: IAlbumDocument;
let testTracks: ITrackDocument[];

const testUserData = {
	email: "tracklike-test@melodio.com",
	username: "trackliketest",
	password: "Password123!",
	displayName: "Track Like Test User",
};

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@melodio.com`;
}

async function registerAndLoginUser(
	userData: typeof testUserData,
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

describe("Track Like/Dislike", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		app = createApp();

		testArtist = await Artist.create({
			name: "Like Test Artist",
			genres: ["rock"],
			follower_count: 0,
		});

		testAlbum = await Album.create({
			title: "Like Test Album",
			artist_id: testArtist._id,
			cover_image_url: "/cover.jpg",
			release_date: new Date("2024-01-01"),
			genre: "rock",
			total_tracks: 3,
		});

		testTracks = (await Track.insertMany([
			{
				title: "Track 1",
				artist_id: testArtist._id,
				album_id: testAlbum._id,
				duration_in_seconds: 200,
				genre: "rock",
				track_number: 1,
			},
			{
				title: "Track 2",
				artist_id: testArtist._id,
				album_id: testAlbum._id,
				duration_in_seconds: 180,
				genre: "rock",
				track_number: 2,
			},
			{
				title: "Track 3",
				artist_id: testArtist._id,
				album_id: testAlbum._id,
				duration_in_seconds: 220,
				genre: "rock",
				track_number: 3,
			},
		])) as ITrackDocument[];
	});

	afterAll(async () => {
		await TrackLike.deleteMany({});
		await Track.deleteMany({ _id: { $in: testTracks.map((t) => t._id) } });
		await Album.deleteMany({ _id: testAlbum._id });
		await Artist.deleteMany({ _id: testArtist._id });
		await User.deleteMany({});
		await mongoose.disconnect();
	});

	let authToken: string;

	beforeEach(async () => {
		await TrackLike.deleteMany({});
		await User.deleteMany({});
		const uniqueUser = {
			...testUserData,
			email: generateUniqueEmail("track-like-user"),
			username: `tracklikeuser_${Date.now()}`,
		};
		const result = await registerAndLoginUser(uniqueUser);
		authToken = result.token;
	});

	it("should switch from dislike to like", async () => {
		const trackId = testTracks[0]._id.toString();

		// Dislike the track first
		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		// Switch to like
		const response = await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify like response
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.status).toBe("like");
		expect(response.body.data.trackId).toBe(trackId);

		// Verify status persists via like-status endpoint
		const statusRes = await request(app)
			.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(statusRes.body.data.status).toBe("like");
	});

	it("should switch from like to dislike", async () => {
		const trackId = testTracks[1]._id.toString();

		// Like the track first
		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Switch to dislike
		const response = await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify dislike response
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.status).toBe("dislike");
		expect(response.body.data.trackId).toBe(trackId);

		// Verify status persists via like-status endpoint
		const statusRes = await request(app)
			.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(statusRes.body.data.status).toBe("dislike");
	});

	it("should return 404 for non-existent track", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();

		// Attempt to like a non-existent track
		const likeRes = await request(app)
			.post(`${TRACKS_API_BASE}/${fakeId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify 404 for like
		expect(likeRes.status).toBe(404);
		expect(likeRes.body.success).toBe(false);
		expect(likeRes.body.error).toMatch(/not found/i);

		// Attempt to dislike a non-existent track
		const dislikeRes = await request(app)
			.post(`${TRACKS_API_BASE}/${fakeId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify 404 for dislike
		expect(dislikeRes.status).toBe(404);
		expect(dislikeRes.body.success).toBe(false);
		expect(dislikeRes.body.error).toMatch(/not found/i);
	});

	it("should remove a reaction", async () => {
		const trackId = testTracks[0]._id.toString();

		// Like the track
		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Remove the reaction
		const response = await request(app)
			.delete(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify removal response
		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.status).toBeNull();
		expect(response.body.data.trackId).toBe(trackId);

		// Verify status is null via like-status endpoint
		const statusRes = await request(app)
			.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(statusRes.body.data.status).toBeNull();
	});

	it("should exclude disliked tracks from liked list", async () => {
		// Like two tracks, dislike one
		await request(app)
			.post(`${TRACKS_API_BASE}/${testTracks[0]._id.toString()}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		await request(app)
			.post(`${TRACKS_API_BASE}/${testTracks[1]._id.toString()}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		await request(app)
			.post(`${TRACKS_API_BASE}/${testTracks[2]._id.toString()}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Fetch liked tracks list
		const response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify only liked tracks are returned
		expect(response.status).toBe(200);
		expect(response.body.data.items).toHaveLength(2);
		expect(response.body.data.total).toBe(2);

		// Verify disliked track is excluded
		const likedTitles = response.body.data.items.map(
			(item: { title: string }) => item.title,
		);
		expect(likedTitles).not.toContain("Track 2");

		// Verify likedIds and dislikedIds arrays
		expect(response.body.data.likedIds).toContain(testTracks[0]._id.toString());
		expect(response.body.data.likedIds).toContain(testTracks[2]._id.toString());
		expect(response.body.data.dislikedIds).toContain(testTracks[1]._id.toString());
	});

	it("should like a track and include it in the liked list", async () => {
		const trackId = testTracks[0]._id.toString();

		// Like the track
		const likeRes = await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify like response
		expect(likeRes.status).toBe(200);
		expect(likeRes.body.data.status).toBe("like");

		// Fetch liked tracks list
		const listRes = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify track appears in liked list and likedIds
		expect(listRes.status).toBe(200);
		const itemIds = listRes.body.data.items.map((item: { _id: string }) => item._id);
		expect(itemIds).toContain(trackId);
		expect(listRes.body.data.likedIds).toContain(trackId);
	});

	it("should dislike a track and exclude it from the liked list", async () => {
		const trackId = testTracks[0]._id.toString();

		// Dislike the track
		const dislikeRes = await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify dislike response
		expect(dislikeRes.status).toBe(200);
		expect(dislikeRes.body.data.status).toBe("dislike");

		// Fetch liked tracks list
		const listRes = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify track does not appear in liked list but appears in dislikedIds
		expect(listRes.status).toBe(200);
		const itemIds = listRes.body.data.items.map((item: { _id: string }) => item._id);
		expect(itemIds).not.toContain(trackId);
		expect(listRes.body.data.dislikedIds).toContain(trackId);
	});

	it("should use default pagination when no query params are provided", async () => {
		// Like all 3 tracks
		for (const track of testTracks) {
			await request(app)
				.post(`${TRACKS_API_BASE}/${track._id.toString()}/like`)
				.set("Authorization", `Bearer ${authToken}`);
		}

		// Fetch liked tracks without pagination params
		const response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.set("Authorization", `Bearer ${authToken}`);

		// Verify default pagination values
		expect(response.status).toBe(200);
		expect(response.body.data.page).toBe(1);
		expect(response.body.data.limit).toBe(7);
		expect(response.body.data.total).toBe(3);
		expect(response.body.data.totalPages).toBe(1);
		expect(response.body.data.items).toHaveLength(3);
	});

	it("should paginate liked tracks when page and limit are provided", async () => {
		// Like all 3 tracks
		for (const track of testTracks) {
			await request(app)
				.post(`${TRACKS_API_BASE}/${track._id.toString()}/like`)
				.set("Authorization", `Bearer ${authToken}`);
		}

		// Fetch page 1 with limit 2
		const page1Response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.query({ page: 1, limit: 2 })
			.set("Authorization", `Bearer ${authToken}`);

		// Verify page 1 metadata and items
		expect(page1Response.status).toBe(200);
		expect(page1Response.body.data.items).toHaveLength(2);
		expect(page1Response.body.data.page).toBe(1);
		expect(page1Response.body.data.limit).toBe(2);
		expect(page1Response.body.data.total).toBe(3);
		expect(page1Response.body.data.totalPages).toBe(2);

		// Fetch page 2 with limit 2
		const page2Response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.query({ page: 2, limit: 2 })
			.set("Authorization", `Bearer ${authToken}`);

		// Verify page 2 has remaining item
		expect(page2Response.status).toBe(200);
		expect(page2Response.body.data.items).toHaveLength(1);
		expect(page2Response.body.data.page).toBe(2);
	});
});
