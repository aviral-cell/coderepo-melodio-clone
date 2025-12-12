import { Response, NextFunction } from "express";
import { searchService } from "./search.service.js";
import { sendSuccess } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const searchController = {
	async search(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const query = (req.query.q as string) || "";
			const results = await searchService.search(query);
			sendSuccess(res, results);
		} catch (error) {
			next(error);
		}
	},
};
