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
import { Album, IAlbumDocument } from "../../backend/src/features/albums/album.model";
import { Track, ITrackDocument } from "../../backend/src/features/tracks/track.model";
import { TrackLike } from "../../backend/src/features/tracks/track-like.model";

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

		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		const response = await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.status).toBe("like");
		expect(response.body.data.trackId).toBe(trackId);

		const statusRes = await request(app)
			.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(statusRes.body.data.status).toBe("like");
	});

	it("should switch from like to dislike", async () => {
		const trackId = testTracks[1]._id.toString();

		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		const response = await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.status).toBe("dislike");
		expect(response.body.data.trackId).toBe(trackId);

		const statusRes = await request(app)
			.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(statusRes.body.data.status).toBe("dislike");
	});

	it("should return 404 for non-existent track", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();

		const likeRes = await request(app)
			.post(`${TRACKS_API_BASE}/${fakeId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(likeRes.status).toBe(404);
		expect(likeRes.body.success).toBe(false);
		expect(likeRes.body.error).toMatch(/not found/i);

		const dislikeRes = await request(app)
			.post(`${TRACKS_API_BASE}/${fakeId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(dislikeRes.status).toBe(404);
		expect(dislikeRes.body.success).toBe(false);
		expect(dislikeRes.body.error).toMatch(/not found/i);
	});

	it("should remove a reaction", async () => {
		const trackId = testTracks[0]._id.toString();

		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		const response = await request(app)
			.delete(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.status).toBeNull();
		expect(response.body.data.trackId).toBe(trackId);

		const statusRes = await request(app)
			.get(`${TRACKS_API_BASE}/${trackId}/like-status`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(statusRes.body.data.status).toBeNull();
	});

	it("should exclude disliked tracks from liked list", async () => {
		await request(app)
			.post(`${TRACKS_API_BASE}/${testTracks[0]._id.toString()}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		await request(app)
			.post(`${TRACKS_API_BASE}/${testTracks[1]._id.toString()}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		await request(app)
			.post(`${TRACKS_API_BASE}/${testTracks[2]._id.toString()}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		const response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.items).toHaveLength(2);
		expect(response.body.data.total).toBe(2);

		const likedTitles = response.body.data.items.map(
			(item: { title: string }) => item.title,
		);
		expect(likedTitles).not.toContain("Track 2");
	});

	it("should respect pagination params", async () => {
		for (const track of testTracks) {
			await request(app)
				.post(`${TRACKS_API_BASE}/${track._id.toString()}/like`)
				.set("Authorization", `Bearer ${authToken}`);
		}

		const page1Response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.query({ page: 1, limit: 2 })
			.set("Authorization", `Bearer ${authToken}`);

		expect(page1Response.status).toBe(200);
		expect(page1Response.body.data.items).toHaveLength(2);
		expect(page1Response.body.data.page).toBe(1);
		expect(page1Response.body.data.limit).toBe(2);
		expect(page1Response.body.data.total).toBe(3);
		expect(page1Response.body.data.totalPages).toBe(2);

		const page2Response = await request(app)
			.get(`${TRACKS_API_BASE}/liked`)
			.query({ page: 2, limit: 2 })
			.set("Authorization", `Bearer ${authToken}`);

		expect(page2Response.status).toBe(200);
		expect(page2Response.body.data.items).toHaveLength(1);
		expect(page2Response.body.data.page).toBe(2);
	});

	it("should remove track from liked tracks list after disliking it", async () => {
		const trackId = testTracks[0]._id.toString();

		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/like`)
			.set("Authorization", `Bearer ${authToken}`);

		let response = await request(app)
			.get(`${TRACKS_API_BASE}/liked/ids`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.body.data.likedIds).toContain(trackId);
		expect(response.body.data.dislikedIds).not.toContain(trackId);

		await request(app)
			.post(`${TRACKS_API_BASE}/${trackId}/dislike`)
			.set("Authorization", `Bearer ${authToken}`);

		response = await request(app)
			.get(`${TRACKS_API_BASE}/liked/ids`)
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.body.data.likedIds).not.toContain(trackId);
		expect(response.body.data.dislikedIds).toContain(trackId);
	});
});
