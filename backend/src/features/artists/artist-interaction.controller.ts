import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/types/index.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { artistInteractionService } from "./artist-interaction.service.js";

async function toggleFollow(
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> {
	try {
		const artistId = req.body.artistId;
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
		res.status(500).json({ success: false, error: "An error occurred" });
	}
}

async function rateArtist(
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> {
	try {
		const artistId = req.body.id;
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

		const result = await artistInteractionService.rateArtist(userId, artistId, rating as number);
		sendSuccess(res, result);
	} catch (error) {
		res.status(500).json({ success: false, error: "An error occurred" });
	}
}

async function getInteraction(
	req: AuthenticatedRequest,
	res: Response,
): Promise<void> {
	try {
		const artistId = req.body.id;
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
		res.status(500).json({ success: false, error: "An error occurred" });
	}
}

export const artistInteractionController = { toggleFollow, rateArtist, getInteraction };
