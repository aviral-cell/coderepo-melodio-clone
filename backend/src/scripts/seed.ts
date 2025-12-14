import * as dotenv from "dotenv";
dotenv.config();

import * as bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { User } from "../features/users/user.model.js";
import { Artist } from "../features/artists/artist.model.js";
import { Album } from "../features/albums/album.model.js";
import { Track } from "../features/tracks/track.model.js";
import { Playlist } from "../features/playlists/playlist.model.js";
import { initConfig } from "../shared/config/index.js";

const config = initConfig();

interface ArtistSeedData {
	name: string;
	genre: string;
	bio: string;
	albums: AlbumSeedData[];
}

interface AlbumSeedData {
	title: string;
	releaseDate: Date;
	tracks: TrackSeedData[];
}

interface TrackSeedData {
	title: string;
	durationInSeconds: number;
}

function randomDuration(): number {
	return Math.floor(Math.random() * (300 - 180 + 1)) + 180;
}

function getImageUrl(seed: string): string {
	const normalizedSeed = seed.toLowerCase().replace(/\s+/g, "-");

	if (normalizedSeed.startsWith("artist-")) {
		const name = normalizedSeed.replace("artist-", "");
		return `/images/artists/${name}.jpg`;
	}
	if (normalizedSeed.startsWith("album-")) {
		const name = normalizedSeed.replace("album-", "");
		return `/images/albums/${name}.jpg`;
	}
	if (normalizedSeed.startsWith("track-")) {
		const name = normalizedSeed.replace("track-", "");
		return `/images/tracks/${name}.jpg`;
	}
	if (normalizedSeed.startsWith("playlist-")) {
		return `/images/playlists/${normalizedSeed}.jpg`;
	}

	return `/images/${normalizedSeed}.jpg`;
}

const artistsSeedData: ArtistSeedData[] = [
	{
		name: "The Amplifiers",
		genre: "rock",
		bio: "A powerful rock band known for electrifying performances and anthemic songs.",
		albums: [
			{
				title: "Electric Storm",
				releaseDate: new Date("2022-03-15"),
				tracks: [
					{ title: "Thunder Road", durationInSeconds: randomDuration() },
					{ title: "Lightning Strike", durationInSeconds: randomDuration() },
					{ title: "Storm Chaser", durationInSeconds: randomDuration() },
					{ title: "Electric Rain", durationInSeconds: randomDuration() },
					{ title: "Voltage Drop", durationInSeconds: randomDuration() },
				],
			},
			{
				title: "Voltage",
				releaseDate: new Date("2023-07-20"),
				tracks: [
					{ title: "High Voltage", durationInSeconds: randomDuration() },
					{ title: "Power Surge", durationInSeconds: randomDuration() },
					{ title: "Circuit Breaker", durationInSeconds: randomDuration() },
					{ title: "Amp It Up", durationInSeconds: randomDuration() },
					{ title: "Wired", durationInSeconds: randomDuration() },
				],
			},
		],
	},
	{
		name: "Neon Dreams",
		genre: "pop",
		bio: "Chart-topping pop sensation with catchy hooks and unforgettable melodies.",
		albums: [
			{
				title: "Starlight",
				releaseDate: new Date("2021-11-10"),
				tracks: [
					{ title: "Dancing in the Moonlight", durationInSeconds: randomDuration() },
					{ title: "Summer Nights", durationInSeconds: randomDuration() },
					{ title: "Heartbeat", durationInSeconds: randomDuration() },
					{ title: "Cosmic Love", durationInSeconds: randomDuration() },
					{ title: "Stargazer", durationInSeconds: randomDuration() },
				],
			},
			{
				title: "Glow",
				releaseDate: new Date("2023-02-14"),
				tracks: [
					{ title: "Radiant", durationInSeconds: randomDuration() },
					{ title: "Shine On", durationInSeconds: randomDuration() },
					{ title: "Golden Hour", durationInSeconds: randomDuration() },
					{ title: "Luminous", durationInSeconds: randomDuration() },
					{ title: "Firefly", durationInSeconds: randomDuration() },
				],
			},
		],
	},
	{
		name: "Blue Note Quartet",
		genre: "jazz",
		bio: "Sophisticated jazz ensemble blending classic traditions with modern innovation.",
		albums: [
			{
				title: "Midnight Sessions",
				releaseDate: new Date("2020-09-05"),
				tracks: [
					{ title: "Blue Velvet", durationInSeconds: randomDuration() },
					{ title: "Smooth Operator", durationInSeconds: randomDuration() },
					{ title: "Late Night Jazz", durationInSeconds: randomDuration() },
					{ title: "Moonlit Serenade", durationInSeconds: randomDuration() },
					{ title: "Twilight Groove", durationInSeconds: randomDuration() },
				],
			},
			{
				title: "Saxophone Dreams",
				releaseDate: new Date("2022-12-01"),
				tracks: [
					{ title: "Soulful Sax", durationInSeconds: randomDuration() },
					{ title: "Bebop Blues", durationInSeconds: randomDuration() },
					{ title: "Swing Time", durationInSeconds: randomDuration() },
					{ title: "Jazz Fusion", durationInSeconds: randomDuration() },
					{ title: "Cool Breeze", durationInSeconds: randomDuration() },
				],
			},
		],
	},
	{
		name: "Synthwave Collective",
		genre: "electronic",
		bio: "Retro-futuristic electronic producers creating immersive soundscapes.",
		albums: [
			{
				title: "Digital Horizons",
				releaseDate: new Date("2021-06-18"),
				tracks: [
					{ title: "Neon City", durationInSeconds: randomDuration() },
					{ title: "Cyber Drive", durationInSeconds: randomDuration() },
					{ title: "Binary Sunset", durationInSeconds: randomDuration() },
					{ title: "Data Stream", durationInSeconds: randomDuration() },
					{ title: "Pixel Dreams", durationInSeconds: randomDuration() },
				],
			},
			{
				title: "Retrowave",
				releaseDate: new Date("2023-04-22"),
				tracks: [
					{ title: "Arcade Nights", durationInSeconds: randomDuration() },
					{ title: "VHS Memories", durationInSeconds: randomDuration() },
					{ title: "Laser Grid", durationInSeconds: randomDuration() },
					{ title: "Synth Runner", durationInSeconds: randomDuration() },
					{ title: "Chrome Future", durationInSeconds: randomDuration() },
				],
			},
		],
	},
	{
		name: "Urban Beats",
		genre: "hip-hop",
		bio: "Street-smart hip-hop collective delivering hard-hitting beats and clever lyrics.",
		albums: [
			{
				title: "City Streets",
				releaseDate: new Date("2022-08-30"),
				tracks: [
					{ title: "Block Party", durationInSeconds: randomDuration() },
					{ title: "Concrete Jungle", durationInSeconds: randomDuration() },
					{ title: "Street Dreams", durationInSeconds: randomDuration() },
					{ title: "Hood Anthem", durationInSeconds: randomDuration() },
					{ title: "Night Rider", durationInSeconds: randomDuration() },
				],
			},
			{
				title: "Hustle Mode",
				releaseDate: new Date("2023-10-15"),
				tracks: [
					{ title: "Grind Time", durationInSeconds: randomDuration() },
					{ title: "Stack Paper", durationInSeconds: randomDuration() },
					{ title: "Rise Up", durationInSeconds: randomDuration() },
					{ title: "Money Moves", durationInSeconds: randomDuration() },
					{ title: "Boss Level", durationInSeconds: randomDuration() },
				],
			},
		],
	},
];

const testUsers = [
	{
		email: "alex.morgan@melodio.com",
		password: "password123",
		username: "alexmorgan",
		displayName: "Alex Morgan",
	},
	{
		email: "jordan.casey@melodio.com",
		password: "password123",
		username: "jordancasey",
		displayName: "Jordan Casey",
	},
];

async function clearDatabase(): Promise<void> {
	console.log("Clearing existing data...");

	await Promise.all([
		User.deleteMany({}),
		Artist.deleteMany({}),
		Album.deleteMany({}),
		Track.deleteMany({}),
		Playlist.deleteMany({}),
	]);

	console.log("Existing data cleared.");
}

async function seedArtistsAlbumsAndTracks(): Promise<{
	artistCount: number;
	albumCount: number;
	trackCount: number;
}> {
	let artistCount = 0;
	let albumCount = 0;
	let trackCount = 0;

	console.log("Creating artists, albums, and tracks...");

	for (const artistData of artistsSeedData) {
		const artist = await Artist.create({
			name: artistData.name,
			bio: artistData.bio,
			image_url: getImageUrl(`artist-${artistData.name}`),
			genres: [artistData.genre],
			follower_count: Math.floor(Math.random() * 100000),
		});
		artistCount++;
		console.log(`  Created artist: ${artist.name}`);

		for (const albumData of artistData.albums) {
			const album = await Album.create({
				title: albumData.title,
				artist_id: artist._id,
				release_date: albumData.releaseDate,
				cover_image_url: getImageUrl(`album-${albumData.title}`),
				total_tracks: albumData.tracks.length,
			});
			albumCount++;
			console.log(`    Created album: ${album.title}`);

			for (let i = 0; i < albumData.tracks.length; i++) {
				const trackData = albumData.tracks[i]!;
				await Track.create({
					title: trackData.title,
					artist_id: artist._id,
					album_id: album._id,
					duration_in_seconds: trackData.durationInSeconds,
					track_number: i + 1,
					genre: artistData.genre,
					play_count: Math.floor(Math.random() * 10000),
					cover_image_url: getImageUrl(`track-${trackData.title}`),
				});
				trackCount++;
			}
			console.log(`      Created ${albumData.tracks.length} tracks`);
		}
	}

	return { artistCount, albumCount, trackCount };
}

async function seedUsers(): Promise<number> {
	console.log("Creating test users...");

	const saltRounds = 10;
	let userCount = 0;

	for (const userData of testUsers) {
		const passwordHash = await bcrypt.hash(userData.password, saltRounds);

		await User.create({
			email: userData.email,
			username: userData.username,
			password_hash: passwordHash,
			display_name: userData.displayName,
		});

		userCount++;
		console.log(`  Created user: ${userData.username} (${userData.email})`);
	}

	return userCount;
}

async function seedPlaylists(): Promise<number> {
	console.log("Creating playlists...");

	const owner = await User.findOne({ email: "alex.morgan@melodio.com" });
	if (!owner) {
		console.log("  Warning: No user found for playlist ownership");
		return 0;
	}

	const tracks = await Track.find({}).limit(6);
	if (tracks.length < 6) {
		console.log(`  Warning: Only ${tracks.length} tracks found`);
	}

	const trackIds = tracks.map((track) => track._id as Types.ObjectId);

	const playlist = await Playlist.create({
		name: "Playlist 1",
		description: "A curated mix of various tracks",
		owner_id: owner._id,
		track_ids: trackIds,
		cover_image_url: getImageUrl("playlist-1"),
		is_public: true,
	});

	console.log(`  Created playlist: ${playlist.name} (${trackIds.length} tracks)`);

	return 1;
}

async function seed(): Promise<void> {
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(config.mongodbUri);
		console.log("Connected to MongoDB");

		await clearDatabase();

		const { artistCount, albumCount, trackCount } = await seedArtistsAlbumsAndTracks();

		const userCount = await seedUsers();

		const playlistCount = await seedPlaylists();

		console.log("\n========================================");
		console.log("Seeding completed successfully!");
		console.log("========================================");
		console.log(`Artists created: ${artistCount}`);
		console.log(`Albums created: ${albumCount}`);
		console.log(`Tracks created: ${trackCount}`);
		console.log(`Users created: ${userCount}`);
		console.log(`Playlists created: ${playlistCount}`);
		console.log("========================================");
		console.log("\nTest Users:");
		console.log("  Email: alex.morgan@melodio.com | Password: password123");
		console.log("  Email: jordan.casey@melodio.com | Password: password123");
		console.log("========================================\n");
	} catch (error) {
		console.error("Seeding failed:", error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
	}
}

void seed();
