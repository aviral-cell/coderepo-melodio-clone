import { Response } from "express";
import { tracksService } from "./tracks.service.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

export const tracksController = {
	async getAll(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>);

			const genre = req.query["genre"] as string | undefined;
			const artistId = req.query["artistId"] as string | undefined;
			const albumId = req.query["albumId"] as string | undefined;

			if (artistId && !isValidObjectId(artistId)) {
				sendError(res, "Invalid artistId format", 400);
				return;
			}

			if (albumId && !isValidObjectId(albumId)) {
				sendError(res, "Invalid albumId format", 400);
				return;
			}

			const result = await tracksService.findAll(page, limit, genre, artistId, albumId);

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
			const result = await tracksService.search(query || "", 5);

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

			if (!id || !isValidObjectId(id as string)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const track = await tracksService.findById(id as string);

			if (!track) {
				sendError(res, "Track not found", 404);
				return;
			}

			sendSuccess(res, track);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async play(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;

			if (!id || !isValidObjectId(id as string)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const track = await tracksService.incrementPlayCount(id as string);

			if (!track) {
				sendError(res, "Track not found", 404);
				return;
			}

			sendSuccess(res, track);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
