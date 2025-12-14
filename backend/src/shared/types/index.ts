import { Request } from "express";
import { Types } from "mongoose";

export interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
		email: string;
	};
}

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

export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export type ObjectId = Types.ObjectId;

export interface BaseDocument {
	_id: ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

export interface JwtPayload {
	userId: string;
	email: string;
	username: string;
	iat?: number;
	exp?: number;
}

export interface EnvConfig {
	PORT: number;
	MONGODB_URI: string;
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	NODE_ENV: "development" | "production" | "test";
}
