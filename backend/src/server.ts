import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { createApp } from "./app.js";
import { initConfig, getConfig } from "./shared/config/index.js";

const config = initConfig();

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

async function startServer(): Promise<void> {
	await connectDatabase();

	const app = createApp();

	const host = "0.0.0.0";
	const server = app.listen(config.port, host, (err?: Error) => {
		if (err) {
			console.error("Server failed to start:", err);
			process.exit(1);
		}
		console.log(`Server running on http://${host}:${config.port}`);
	});

	server.on("error", (error: NodeJS.ErrnoException) => {
		if (error.code === "EADDRINUSE") {
			console.error(`Port ${config.port} is already in use`);
		} else {
			console.error("Server error:", error);
		}
		process.exit(1);
	});

	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

void startServer();
