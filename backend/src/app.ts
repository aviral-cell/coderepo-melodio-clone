import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { errorMiddleware, notFoundHandler } from "./shared/middleware/error.middleware.js";
import { sanitizeBody } from "./shared/middleware/validation.middleware.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { artistRoutes } from "./features/artists/artists.routes.js";
import { albumRoutes } from "./features/albums/albums.routes.js";
import { trackRoutes } from "./features/tracks/tracks.routes.js";
import { playlistRoutes } from "./features/playlists/playlists.routes.js";

const getPublicDir = (): string => {
	if (typeof __dirname !== "undefined") {
		return path.join(__dirname, "../public");
	}
	return path.join(process.cwd(), "backend/public");
};

export function createApp(): Application {
	const app: Application = express();

	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: "cross-origin" },
			contentSecurityPolicy: {
				directives: {
					...helmet.contentSecurityPolicy.getDefaultDirectives(),
					"frame-ancestors": ["'self'", "*.hrcdn.net", "*.hackerrank.com"],
				},
			},
		}),
	);

	app.use(
		cors({
			origin: "*",
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			optionsSuccessStatus: 204,
		}),
	);
	app.options("*", cors());

	if (process.env["NODE_ENV"] !== "test") {
		app.use(morgan("dev"));
	}

	app.use(express.json({ limit: "10mb" }));
	app.use(express.urlencoded({ extended: true, limit: "10mb" }));

	app.use(sanitizeBody);

	const publicDir = getPublicDir();
	app.use(express.static(publicDir));

	app.get("/", (_req: Request, res: Response) => {
		res.sendFile(path.join(publicDir, "index.html"));
	});

	app.get("/api", (_req: Request, res: Response) => {
		res.json({
			message: "API server is running",
			version: "1.0.0",
		});
	});

	app.get("/health", (_req: Request, res: Response) => {
		res.json({
			status: "ok",
			timestamp: new Date().toISOString(),
		});
	});

	app.use("/api/auth", authRoutes);
	app.use("/api/artists", artistRoutes);
	app.use("/api/albums", albumRoutes);
	app.use("/api/tracks", trackRoutes);
	app.use("/api/playlists", playlistRoutes);

	app.use(notFoundHandler);

	app.use(errorMiddleware);

	return app;
}
