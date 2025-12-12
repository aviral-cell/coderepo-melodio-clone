import { Response, NextFunction } from "express";
import { playlistsService } from "./playlists.service.js";
import {
	sendSuccess,
	sendError,
	isValidObjectId,
} from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const playlistsController = {
	/**
	 * GET /api/playlists
	 * Get all playlists owned by the authenticated user
	 */
	async getAll(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const playlists = await playlistsService.findByOwnerId(userId);
			sendSuccess(res, playlists);
		} catch (error) {
			next(error);
		}
	},

	/**
	 * GET /api/playlists/:id
	 * Get a single playlist by ID with populated tracks
	 * Access control: owner can view any, non-owner can only view public
	 */
	async getById(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;

			// Validate ObjectId format
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
			next(error);
		}
	},

	/**
	 * POST /api/playlists
	 * Create a new playlist
	 */
	async create(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user!.userId;
			const { name, description, isPublic, coverImageUrl } = req.body;

			// Validate required field: name
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
			next(error);
		}
	},

	/**
	 * PATCH /api/playlists/:id
	 * Update a playlist (owner only)
	 */
	async update(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { name, description, isPublic, coverImageUrl } = req.body;

			// Validate ObjectId format
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
			next(error);
		}
	},

	/**
	 * DELETE /api/playlists/:id
	 * Delete a playlist (owner only)
	 */
	async delete(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;

			// Validate ObjectId format
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

			// 204 No Content
			res.status(204).send();
		} catch (error) {
			next(error);
		}
	},

	/**
	 * POST /api/playlists/:id/tracks
	 * Add a track to a playlist (owner only, idempotent)
	 */
	async addTrack(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { trackId } = req.body;

			// Validate playlist ID format
			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			// Validate track ID format
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
			next(error);
		}
	},

	/**
	 * DELETE /api/playlists/:id/tracks/:trackId
	 * Remove a track from a playlist (owner only, idempotent)
	 */
	async removeTrack(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id, trackId } = req.params;
			const userId = req.user!.userId;

			// Validate playlist ID format
			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			// Validate track ID format
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
			next(error);
		}
	},

	/**
	 * PATCH /api/playlists/:id/reorder
	 * Reorder tracks in a playlist (owner only)
	 */
	async reorderTracks(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!.userId;
			const { trackIds } = req.body;

			// Validate playlist ID format
			if (!id || !isValidObjectId(id)) {
				sendError(res, "Invalid playlist ID format", 400);
				return;
			}

			// Validate trackIds array
			if (!Array.isArray(trackIds)) {
				sendError(res, "trackIds must be an array", 400);
				return;
			}

			// Validate all track IDs in array
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
			next(error);
		}
	},
};
