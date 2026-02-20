import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { User } from "../features/users/user.model.js";
import { Artist } from "../features/artists/artist.model.js";
import { Track } from "../features/tracks/track.model.js";
import { Mix } from "../features/mixes/mix.model.js";
import { initConfig } from "../shared/config/index.js";

const config = initConfig();

async function seedMixes(): Promise<void> {
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(config.mongodbUri);
		console.log("Connected to MongoDB");

		await Mix.deleteMany({});
		console.log("Cleared existing mixes.");

		const owner = await User.findOne({ email: "alex.morgan@melodio.com" });
		if (!owner) {
			console.log("Warning: No user found for mix ownership");
			return;
		}

		const rockArtist = await Artist.findOne({ name: "The Amplifiers" });
		const jazzArtist = await Artist.findOne({ name: "Blue Note Quartet" });

		if (!rockArtist || !jazzArtist) {
			console.log("Warning: Required artists not found for seeding mixes");
			return;
		}

		const rockTracks = await Track.find({ artist_id: rockArtist._id })
			.limit(10)
			.select("_id");
		const jazzTracks = await Track.find({ artist_id: jazzArtist._id })
			.limit(10)
			.select("_id");

		const trackIds = [
			...rockTracks.map((t) => t._id as mongoose.Types.ObjectId),
			...jazzTracks.map((t) => t._id as mongoose.Types.ObjectId),
		];

		const mix = await Mix.create({
			user_id: owner._id,
			title: `${rockArtist.name} and ${jazzArtist.name} mix`,
			artist_ids: [rockArtist._id.toString(), jazzArtist._id.toString()],
			config: {
				variety: "medium",
				discovery: "blend",
				filters: [],
			},
			track_ids: trackIds,
			cover_images: [
				rockArtist.image_url ?? "",
				jazzArtist.image_url ?? "",
			].filter(Boolean),
			track_count: trackIds.length,
		});

		console.log(`\nCreated pre-seeded mix: "${mix.title}" (${trackIds.length} tracks)`);
		console.log("========================================");
		console.log("Mix seeding completed successfully!");
		console.log("========================================\n");
	} catch (error) {
		console.error("Mix seeding failed:", error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
	}
}

void seedMixes();
