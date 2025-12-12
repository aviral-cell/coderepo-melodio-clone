import { Response, NextFunction } from "express";
import { albumsService } from "./albums.service.js";
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

export const albumsController = {
	async getAll(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>);

			const artistId = req.query["artistId"] as string | undefined;

			if (artistId && !isValidObjectId(artistId)) {
				sendError(res, "Invalid artistId format", 400);
				return;
			}

			const result = await albumsService.findAll(page, limit, artistId);

			sendSuccess(res, result);
		} catch (error) {
			next(error);
		}
	},

	async search(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const query = req.query["q"] as string | undefined;
			const result = await albumsService.search(query || "", 5);

			sendSuccess(res, result);
		} catch (error) {
			next(error);
		}
	},

	async getById(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid album ID format", 400);
				return;
			}

			const album = await albumsService.findById(id);

			if (!album) {
				sendError(res, "Album not found", 404);
				return;
			}

			sendSuccess(res, album);
		} catch (error) {
			next(error);
		}
	},
};
