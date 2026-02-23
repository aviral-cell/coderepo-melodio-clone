import { Response, NextFunction } from "express";
import { trackLikeService } from "./track-like.service.js";
import { sendSuccess, sendError, isValidObjectId, parsePaginationParams } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const trackLikeController = {
	async likeTrack(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"];

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
			next(error);
		}
	},

	async dislikeTrack(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"];

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
			next(error);
		}
	},

	async removeReaction(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"];

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.removeReaction(userId!, trackId);
			sendSuccess(res, result);
		} catch (error) {
			next(error);
		}
	},

	async getLikedTracks(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const paginationParams = parsePaginationParams(req.query as Record<string, unknown>);

			const result = await trackLikeService.getLikedTracks(userId!, paginationParams);
			sendSuccess(res, result);
		} catch (error) {
			next(error);
		}
	},

	async getLikeStatus(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const trackId = req.params["id"];

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await trackLikeService.getLikeStatus(userId!, trackId);
			sendSuccess(res, result);
		} catch (error) {
			next(error);
		}
	},

	async getLikedIds(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;

			const result = await trackLikeService.getLikedIds(userId!);
			sendSuccess(res, result);
		} catch (error) {
			next(error);
		}
	},
};
