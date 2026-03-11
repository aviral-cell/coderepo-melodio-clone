import { Response } from "express";
import { playlistsService, PlaylistError } from "./playlists.service.js";
import {
	sendSuccess,
	sendError,
	isValidObjectId,
} from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const playlistsController = {
	async getAll(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const playlists = await playlistsService.findByOwnerId(userId);
			sendSuccess(res, playlists);
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
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			const result = await playlistsService.findById(id, userId);

			if (result.accessDenied) {
				sendError(res, "Access denied to private playlist", 403);
				return;
			}

			if (!result.playlist) {
				sendError(res, "Playlist not found", 404);
				return;
			}

			sendSuccess(res, result.playlist);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async create(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const { name, description, isPublic, coverImageUrl } = req.body;

			if (!name || typeof name !== "string" || name.trim() === "") {
				sendError(res, "Name is required and cannot be empty", 400);
				return;
			}

			const playlist = await playlistsService.create(userId, {
				name: name.trim(),
				description: description?.trim(),
				isPublic,
				coverImageUrl,
			});

			sendSuccess(res, playlist, undefined, 201);
		} catch (error) {
			if (error instanceof PlaylistError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async update(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { name, description, isPublic, coverImageUrl } = req.body;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			const result = await playlistsService.update(id, userId, {
				name: name?.trim(),
				description: description?.trim(),
				isPublic,
				coverImageUrl,
			});

			if (result.notFound) {
				sendError(res, "Playlist not found", 404);
				return;
			}

			if (result.accessDenied) {
				sendError(res, "Not authorized to update this playlist", 403);
				return;
			}

			sendSuccess(res, result.playlist);
		} catch (error) {
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
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			const result = await playlistsService.delete(id, userId);

			if (result.notFound) {
				sendError(res, "Playlist not found", 404);
				return;
			}

			if (result.accessDenied) {
				sendError(res, "Not authorized to delete this playlist", 403);
				return;
			}

			res.status(204).send();
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async addTrack(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { trackId } = req.body;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await playlistsService.addTrack(id, trackId, userId);

			if (result.notFound) {
				sendError(res, "Playlist not found", 404);
				return;
			}

			if (result.accessDenied) {
				sendError(res, "Not authorized to modify this playlist", 403);
				return;
			}

			if (result.trackNotFound) {
				sendError(res, "Track not found", 404);
				return;
			}

			sendSuccess(res, result.playlist);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async removeTrack(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id, trackId } = req.params;
			const userId = req.user!.userId;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			if (!trackId || !isValidObjectId(trackId)) {
				sendError(res, "Invalid track ID format", 400);
				return;
			}

			const result = await playlistsService.removeTrack(id, trackId, userId);

			if (result.notFound) {
				sendError(res, "Playlist not found", 404);
				return;
			}

			if (result.accessDenied) {
				sendError(res, "Not authorized to modify this playlist", 403);
				return;
			}

			sendSuccess(res, result.playlist);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async reorderTracks(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { trackIds } = req.body;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			if (!Array.isArray(trackIds)) {
				sendError(res, "trackIds must be an array", 400);
				return;
			}

			for (const trackId of trackIds) {
				if (!isValidObjectId(trackId)) {
					sendError(res, "Invalid track ID format in array", 400);
					return;
				}
			}

			const result = await playlistsService.reorderTracks(id, trackIds, userId);

			if (result.notFound) {
				sendError(res, "Playlist not found", 404);
				return;
			}

			if (result.accessDenied) {
				sendError(res, "Not authorized to modify this playlist", 403);
				return;
			}

			if (result.invalidTrackIds) {
				sendError(
					res,
					"Track IDs do not match the current playlist tracks",
					400,
				);
				return;
			}

			sendSuccess(res, result.playlist);
		} catch (error) {
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async copyPlaylist(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const { name } = req.body;
			const userId = req.user!.userId;

			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			const playlist = await playlistsService.copyPlaylist(id, userId, name);

			sendSuccess(res, playlist, undefined, 201);
		} catch (error) {
			if (error instanceof PlaylistError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
