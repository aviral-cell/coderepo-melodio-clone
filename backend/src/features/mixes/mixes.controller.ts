import { Response } from "express";
import { mixesService, MixError } from "./mixes.service.js";
import {
	sendSuccess,
	sendError,
	isValidObjectId,
} from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const mixesController = {
	async create(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const { title, artistIds, config, trackIds, coverImages } = req.body;

			if (!title || typeof title !== "string" || title.trim() === "") {
				sendError(res, "Title is required and cannot be empty", 400);
				return;
			}

			if (!Array.isArray(artistIds) || artistIds.length === 0) {
				sendError(res, "At least one artist ID is required", 400);
				return;
			}

			if (!Array.isArray(trackIds) || trackIds.length === 0) {
				sendError(res, "At least one track ID is required", 400);
				return;
			}

			for (const trackId of trackIds) {
				if (!isValidObjectId(trackId)) {
					sendError(res, "Invalid track ID format in trackIds", 400);
					return;
				}
			}

			const mix = await mixesService.createMix(userId, {
				title: title.trim(),
				artistIds,
				config,
				trackIds,
				coverImages,
			});

			sendSuccess(res, mix, undefined, 201);
		} catch (error) {
			if (error instanceof MixError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getAll(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const mixes = await mixesService.getUserMixes(userId);
			sendSuccess(res, mixes);
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
			const userId = req.user!.userId;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid mix ID format", 400);
				return;
			}

			const mix = await mixesService.getMixById(userId, id);
			sendSuccess(res, mix);
		} catch (error) {
			if (error instanceof MixError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async rename(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { title } = req.body;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid mix ID format", 400);
				return;
			}

			if (!title || typeof title !== "string" || title.trim() === "") {
				sendError(res, "Title is required and cannot be empty", 400);
				return;
			}

			const mix = await mixesService.renameMix(userId, id, title.trim());
			sendSuccess(res, mix);
		} catch (error) {
			if (error instanceof MixError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async delete(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid mix ID format", 400);
				return;
			}

			await mixesService.deleteMix(userId, id);
			res.status(204).send();
		} catch (error) {
			if (error instanceof MixError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
