import { Response } from "express";
import { trackLikeService } from "./track-like.service.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const trackLikeController = {
	async likeTrack(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.body.trackId;

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.dislikeTrack(userId!, trackId);
			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async dislikeTrack(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.body.trackId;

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.likeTrack(userId!, trackId);
			sendSuccess(res, result);
		} catch (error) {
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
			const paginationParams = { page: 1, limit: 100 };

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
			const trackId = req.body.trackId;

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

	async getLikedIds(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;

			const result = await trackLikeService.getLikedIds(userId!);
			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
