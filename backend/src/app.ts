import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware, notFoundHandler } from "./shared/middleware/error.middleware.js";
import { sanitizeBody } from "./shared/middleware/validation.middleware.js";

/**
 * Create and configure the Express application
 */
export function createApp(): Application {
	const app: Application = express();

	// Security middleware
	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: "cross-origin" },
		}),
	);

	// CORS configuration
	const corsOrigin = process.env["CORS_ORIGIN"] || "http://localhost:4000";
	app.use(
		cors({
			origin: corsOrigin,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
			optionsSuccessStatus: 204,
		}),
	);
	app.options("*", cors());

	// Request logging
	if (process.env["NODE_ENV"] !== "test") {
		app.use(morgan("dev"));
	}

	// Body parsing middleware
	app.use(express.json({ limit: "10mb" }));
	app.use(express.urlencoded({ extended: true, limit: "10mb" }));

	// Sanitize request body
	app.use(sanitizeBody);

	// Root endpoint - HTML response
	app.get("/", (_req: Request, res: Response) => {
		res.send("<h1>API server is running</h1>");
	});

	// API root endpoint - JSON response
	app.get("/api", (_req: Request, res: Response) => {
		res.json({
			message: "API server is running",
			version: "1.0.0",
		});
	});

	// Health check endpoint
	app.get("/health", (_req: Request, res: Response) => {
		res.json({
			status: "ok",
			timestamp: new Date().toISOString(),
		});
	});

	// ============================================
	// API Routes (to be added in Phase 2+)
	// ============================================
	// app.use("/api/v1/auth", authRoutes);
	// app.use("/api/v1/users", userRoutes);
	// app.use("/api/v1/artists", artistRoutes);
	// app.use("/api/v1/albums", albumRoutes);
	// app.use("/api/v1/tracks", trackRoutes);
	// app.use("/api/v1/playlists", playlistRoutes);
	// app.use("/api/v1/search", searchRoutes);

	// 404 handler for unmatched routes
	app.use(notFoundHandler);

	// Global error handler
	app.use(errorMiddleware);

	return app;
}
