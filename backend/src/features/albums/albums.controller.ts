import { Response, NextFunction } from "express";
import { albumsService } from "./albums.service.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Parse and validate pagination parameters
 */
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
	/**
	 * GET /api/albums
	 * Get paginated list of albums sorted by releaseDate descending
	 * Optional artistId filter query parameter
	 */
	async getAll(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>);

			// Extract optional artistId filter
			const artistId = req.query["artistId"] as string | undefined;

			// Validate artistId format if provided
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

	/**
	 * GET /api/albums/search
	 * Search albums by title using text search
	 */
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

	/**
	 * GET /api/albums/:id
	 * Get a single album by ID
	 */
	async getById(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;

			// Validate ObjectId format
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
