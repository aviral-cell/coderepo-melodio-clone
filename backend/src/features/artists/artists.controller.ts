import { Response } from "express";
import { artistsService } from "./artists.service.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parsePaginationParams(query: Record<string, unknown>): { page: number; limit: number } {
	let page = DEFAULT_PAGE;
	let limit = DEFAULT_LIMIT;

	if (typeof query["page"] === "string") {
		const parsedPage = parseInt(query["page"], 10);
		if (!isNaN(parsedPage) && parsedPage >= 1) {
			page = parsedPage;
		}
	}

	if (typeof query["limit"] === "string") {
		const parsedLimit = parseInt(query["limit"], 10);
		if (!isNaN(parsedLimit) && parsedLimit >= 1) {
			limit = Math.min(parsedLimit, MAX_LIMIT);
		}
	}

	return { page, limit };
}

export const artistsController = {
	async getAll(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>);
			const result = await artistsService.findAll(page, limit);

			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async search(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const query = req.query["q"] as string | undefined;
			const result = await artistsService.search(query || "", 5);

			sendSuccess(res, result);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getById(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid artist ID format", 400);
				return;
			}

			const artist = await artistsService.findById(id);

			if (!artist) {
				sendError(res, "Artist not found", 404);
				return;
			}

			sendSuccess(res, artist);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
