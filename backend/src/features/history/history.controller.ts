import { Response } from "express";
import { historyService } from "./history.service.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const historyController = {
	async recordPlay(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const { trackId } = req.body;

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			try {
				await historyService.recordPlay(userId, trackId);
				sendSuccess(res, { recorded: true }, "Play recorded successfully");
			} catch (error) {
				if (error instanceof Error && error.message === "Track not found") {
					sendError(res, "Track not found", 404);
					return;
				}
				throw error;
			}
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getRecentlyPlayed(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const limitParam = req.query["limit"];
			const limit =
				typeof limitParam === "string" ? parseInt(limitParam, 10) : 20;
			const offsetParam = req.query["offset"];
			const offset =
				typeof offsetParam === "string" ? parseInt(offsetParam, 10) : 0;

			const result = await historyService.getRecentlyPlayed(userId, limit, offset);

			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async clearHistory(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;

			await historyService.clearHistory(userId);

			sendSuccess(res, { cleared: true }, "History cleared successfully");
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
