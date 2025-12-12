import { Request, Response, NextFunction } from "express";
import { authService, AuthError } from "./auth.service.js";
import { sendSuccess, sendError } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const authController = {
	async register(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { email, username, password, displayName } = req.body as {
				email?: string;
				username?: string;
				password?: string;
				displayName?: string;
			};

			if (!email || email.trim() === "") {
				sendError(res, "Email is required", 400);
				return;
			}

			if (!isValidEmail(email)) {
				sendError(res, "Invalid email format", 400);
				return;
			}

			if (!username || username.trim() === "") {
				sendError(res, "Username is required", 400);
				return;
			}

			if (!password || password.trim() === "") {
				sendError(res, "Password is required", 400);
				return;
			}

			if (!displayName || displayName.trim() === "") {
				sendError(res, "Display name is required", 400);
				return;
			}

			const result = await authService.register({
				email,
				username,
				password,
				displayName,
			});

			sendSuccess(res, result, undefined, 201);
		} catch (error) {
			if (error instanceof AuthError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			next(error);
		}
	},

	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { email, password } = req.body as {
				email?: string;
				password?: string;
			};

			if (!email || email.trim() === "") {
				sendError(res, "Email is required", 400);
				return;
			}

			if (!password || password.trim() === "") {
				sendError(res, "Password is required", 400);
				return;
			}

			const result = await authService.login({ email, password });

			sendSuccess(res, result);
		} catch (error) {
			if (error instanceof AuthError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			next(error);
		}
	},

	async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			const user = await authService.getMe(userId);

			sendSuccess(res, user);
		} catch (error) {
			if (error instanceof AuthError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			next(error);
		}
	},
};
