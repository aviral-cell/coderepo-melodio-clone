import { Response } from "express";
import { trackLikeService } from "./track-like.service.js";
import { sendSuccess, sendError, isValidObjectId, parsePaginationParams } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const trackLikeController = {
	async likeTrack(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"] as string;

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.likeTrack(userId!, trackId);
			sendSuccess(res, result);
		} catch (error) {
			if (error instanceof Error && error.message === "Track not found") {
				sendError(res, error.message, 404);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async dislikeTrack(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"] as string;

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.dislikeTrack(userId!, trackId);
			sendSuccess(res, result);
		} catch (error) {
			if (error instanceof Error && error.message === "Track not found") {
				sendError(res, error.message, 404);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async removeReaction(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"];

			if (!trackId || !isValidObjectId(trackId as string)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.removeReaction(userId!, trackId as string);
			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getLikedTracks(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const paginationParams = parsePaginationParams(req.query as Record<string, unknown>);
			if (typeof req.query["limit"] !== "string") {
				paginationParams.limit = 7;
			}

			const result = await trackLikeService.getLikedTracks(userId!, paginationParams);
			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getLikeStatus(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"];

			if (!trackId || !isValidObjectId(trackId as string)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.getLikeStatus(userId!, trackId as string);
			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

};
