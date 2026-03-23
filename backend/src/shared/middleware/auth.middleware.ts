import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtPayload } from "../types/index.js";
import { sendError } from "../utils/index.js";
import { User } from "../../features/users/user.model.js";

export async function authMiddleware(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			sendError(res, "Authorization header is required", 401);
			return;
		}

		const parts = authHeader.split(" ");
		if (parts.length !== 2 || parts[0] !== "Bearer") {
			sendError(res, "Invalid authorization header format", 401);
			return;
		}

		const token = parts[1];
		if (!token) {
			sendError(res, "Token is required", 401);
			return;
		}

		const jwtSecret = process.env["JWT_SECRET"];
		if (!jwtSecret) {
			console.error("JWT_SECRET is not configured");
			sendError(res, "Server configuration error", 500);
			return;
		}

		const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

		const user = await User.findById(decoded.userId).exec();

		if (!user) {
			sendError(res, "User not found", 401);
			return;
		}

		req.user = {
			userId: decoded.userId,
			email: decoded.email,
		};

		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			sendError(res, "Token has expired", 401);
			return;
		}

		if (error instanceof jwt.JsonWebTokenError) {
			sendError(res, "Invalid token", 401);
			return;
		}

		console.error("Auth middleware error:", error);
		sendError(res, "Authentication failed", 401);
	}
}

function optionalAuthMiddleware(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			next();
			return;
		}

		const parts = authHeader.split(" ");
		if (parts.length !== 2 || parts[0] !== "Bearer") {
			next();
			return;
		}

		const token = parts[1];
		if (!token) {
			next();
			return;
		}

		const jwtSecret = process.env["JWT_SECRET"];
		if (!jwtSecret) {
			next();
			return;
		}

		const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

		req.user = {
			userId: decoded.userId,
			email: decoded.email,
		};

		next();
	} catch {
		next();
	}
}
