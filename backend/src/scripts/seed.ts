/**
 * Database Seed Script
 *
 * This script populates the MongoDB database with sample data for development and testing.
 *
 * Run with: npm run seed
 *
 * Creates:
 * - 5 artists (one per genre: rock, pop, jazz, electronic, hip-hop)
 * - 10 albums (2 per artist)
 * - 50 tracks (5 per album, durations between 180-300 seconds)
 * - 2 test users with known credentials
 * - 1 test playlist with 6 tracks
 *
 * TODO: Implement seed logic in Phase 2+
 */

import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const MONGODB_URI =
	process.env["MONGODB_URI"] ||
	"mongodb://root:Root123@localhost:27017/melodio_app?authSource=admin";

async function seed(): Promise<void> {
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(MONGODB_URI);
		console.log("Connected to MongoDB");

		// TODO: Implement seeding logic
		console.log("Seed script placeholder - implement in Phase 2+");

		console.log("\n========================================");
		console.log("Seeding completed successfully!");
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
