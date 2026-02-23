import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../shared/types/index.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { artistInteractionService } from "./artist-interaction.service.js";

async function toggleFollow(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const artistId = req.params["id"];
		const userId = req.user?.userId;

		if (!artistId || !isValidObjectId(artistId)) {
			sendError(res, "Invalid artist ID format", 400);
			return;
		}

		if (!userId) {
			sendError(res, "Authentication required", 401);
			return;
		}

		const result = await artistInteractionService.toggleFollow(userId, artistId);
		sendSuccess(res, result);
	} catch (error) {
		if (error instanceof Error && error.message === "Artist not found") {
			sendError(res, "Artist not found", 404);
			return;
		}
		next(error);
	}
}

async function rateArtist(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const artistId = req.params["id"];
		const userId = req.user?.userId;
		const { rating } = req.body as { rating: unknown };

		if (!artistId || !isValidObjectId(artistId)) {
			sendError(res, "Invalid artist ID format", 400);
			return;
		}

		if (!userId) {
			sendError(res, "Authentication required", 401);
			return;
		}

		if (
			typeof rating !== "number" ||
			rating < 0.5 ||
			rating > 5 ||
			(rating * 2) % 1 !== 0
		) {
			sendError(res, "Rating must be between 0.5 and 5.0 in 0.5 increments", 400);
			return;
		}

		const result = await artistInteractionService.rateArtist(userId, artistId, rating);
		sendSuccess(res, result);
	} catch (error) {
		if (error instanceof Error && error.message === "Artist not found") {
			sendError(res, "Artist not found", 404);
			return;
		}
		next(error);
	}
}

async function getInteraction(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const artistId = req.params["id"];
		const userId = req.user?.userId;

		if (!artistId || !isValidObjectId(artistId)) {
			sendError(res, "Invalid artist ID format", 400);
			return;
		}

		if (!userId) {
			sendError(res, "Authentication required", 401);
			return;
		}

		const result = await artistInteractionService.getInteraction(userId, artistId);
		sendSuccess(res, result);
	} catch (error) {
		if (error instanceof Error && error.message === "Artist not found") {
			sendError(res, "Artist not found", 404);
			return;
		}
		next(error);
	}
}

export const artistInteractionController = { toggleFollow, rateArtist, getInteraction };
