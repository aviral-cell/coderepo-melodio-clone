import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { createApp } from "./app.js";
import { initConfig, getConfig } from "./shared/config/index.js";

// Initialize configuration - validates all required env vars
const config = initConfig();

/**
 * Connect to MongoDB database
 */
async function connectDatabase(): Promise<void> {
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(config.mongodbUri);
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection failed:", error);
		process.exit(1);
	}
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
	console.log(`\n${signal} received. Shutting down gracefully...`);

	try {
		await mongoose.connection.close();
		console.log("MongoDB connection closed.");
		process.exit(0);
	} catch (error) {
		console.error("Error during shutdown:", error);
		process.exit(1);
	}
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
	// Connect to database
	await connectDatabase();

	// Create Express app
	const app = createApp();

	// Start listening
	const server = app.listen(config.port, () => {
		console.log(`Server running on http://localhost:${config.port}`);
		console.log(`Environment: ${config.nodeEnv}`);
	});

	// Handle server errors
	server.on("error", (error: NodeJS.ErrnoException) => {
		if (error.code === "EADDRINUSE") {
			console.error(`Port ${config.port} is already in use`);
		} else {
			console.error("Server error:", error);
		}
		process.exit(1);
	});

	// Graceful shutdown handlers
	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

// Start the server
void startServer();
