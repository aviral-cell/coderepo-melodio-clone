import { Response } from "express";
import { concertsService, ConcertError } from "./concerts.service.js";
import {
	sendSuccess,
	sendError,
	isValidObjectId,
} from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const concertsController = {
	async list(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const monthParam = req.query.month;
			const cityParam = req.query.city;

			const month =
				typeof monthParam === "string" ? parseInt(monthParam, 10) : undefined;
			const city =
				typeof cityParam === "string" ? cityParam : undefined;

			const concerts = await concertsService.getUpcoming(month, city);
			sendSuccess(res, concerts);
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
				sendError(res, "Invalid concert ID format", 400);
				return;
			}

			const concert = await concertsService.getById(id as string);

			if (!concert) {
				sendError(res, "Concert not found", 404);
				return;
			}

			sendSuccess(res, concert);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async buyTickets(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { quantity } = req.body;

			if (!id || !isValidObjectId(id as string)) {
				sendError(res, "Invalid concert ID format", 400);
				return;
			}

			if (
				typeof quantity !== "number" ||
				!Number.isInteger(quantity) ||
				quantity < 1 ||
				quantity > 6
			) {
				sendError(
					res,
					"Quantity must be an integer between 1 and 6",
					400,
				);
				return;
			}

			const result = await concertsService.buyTickets(id as string, userId, quantity);
			sendSuccess(res, result, undefined, 201);
		} catch (error) {
			if (error instanceof ConcertError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getUserTickets(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;

			if (!id || !isValidObjectId(id as string)) {
				sendError(res, "Invalid concert ID format", 400);
				return;
			}

			const tickets = await concertsService.getUserTickets(id as string, userId);
			sendSuccess(res, tickets);
		} catch (error) {
			if (error instanceof ConcertError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
