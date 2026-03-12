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

			sendSuccess(res, { message: "Play recorded" });
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

			sendSuccess(res, { tracks: [], total: 0 });
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

			res.status(204).send();
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
