import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { errorMiddleware, notFoundHandler } from "./shared/middleware/error.middleware.js";
import { sanitizeBody } from "./shared/middleware/validation.middleware.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { artistInteractionRoutes } from "./features/artists/artist-interaction.routes.js";
import { artistRoutes } from "./features/artists/artists.routes.js";
import { albumRoutes } from "./features/albums/albums.routes.js";
import { trackLikeRoutes } from "./features/tracks/track-like.routes.js";
import { trackRoutes } from "./features/tracks/tracks.routes.js";
import { playlistRoutes } from "./features/playlists/playlists.routes.js";
import { subscriptionRoutes } from "./features/subscription/subscription.routes.js";
import { paymentRoutes } from "./features/payment/payment.routes.js";
import { familyRoutes } from "./features/family/family.routes.js";
import { historyRoutes } from "./features/history/history.routes.js";
import { mixRoutes } from "./features/mixes/mixes.routes.js";
import { concertRoutes } from "./features/concerts/concerts.routes.js";

const getPublicDir = (): string => {
	if (typeof __dirname !== "undefined") {
		return path.join(__dirname, "../public");
	}
	return path.join(process.cwd(), "backend/public");
};

export function createApp(): Application {
	const app: Application = express();

	app.use(cors());

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
	app.use("/api/artists", artistInteractionRoutes);
	app.use("/api/artists", artistRoutes);
	app.use("/api/albums", albumRoutes);
	app.use("/api/tracks", trackLikeRoutes);
	app.use("/api/tracks", trackRoutes);
	app.use("/api/playlists", playlistRoutes);
	app.use("/api/subscription", subscriptionRoutes);
	app.use("/api/payment", paymentRoutes);
	app.use("/api/payments", paymentRoutes);
	app.use("/api/family", familyRoutes);
	app.use("/api/history", historyRoutes);
	app.use("/api/mixes", mixRoutes);
	app.use("/api/concerts", concertRoutes);

	app.use(notFoundHandler);

	app.use(errorMiddleware);

	return app;
}
