import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { createApp } from "./app.js";

const PORT = parseInt(process.env["PORT"] ?? "6000", 10);
const MONGODB_URI =
	process.env["MONGODB_URI"] ||
	"mongodb://root:Root123@localhost:27017/melodio_app?authSource=admin";

/**
 * Connect to MongoDB database
 */
async function connectDatabase(): Promise<void> {
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(MONGODB_URI);
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
	const server = app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
		console.log(`Environment: ${process.env["NODE_ENV"] || "development"}`);
	});

	// Handle server errors
	server.on("error", (error: NodeJS.ErrnoException) => {
		if (error.code === "EADDRINUSE") {
			console.error(`Port ${PORT} is already in use`);
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
