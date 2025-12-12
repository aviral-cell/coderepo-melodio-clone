import { Request } from "express";
import { Types } from "mongoose";

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
		email: string;
	};
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	errors?: Array<{
		field: string;
		message: string;
	}>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

/**
 * MongoDB ObjectId type alias
 */
export type ObjectId = Types.ObjectId;

/**
 * Base document interface with timestamps
 */
export interface BaseDocument {
	_id: ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * JWT Payload structure
 */
export interface JwtPayload {
	userId: string;
	email: string;
	username: string;
	iat?: number;
	exp?: number;
}

/**
 * Environment configuration
 */
export interface EnvConfig {
	PORT: number;
	MONGODB_URI: string;
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	NODE_ENV: "development" | "production" | "test";
	CORS_ORIGIN: string;
}
