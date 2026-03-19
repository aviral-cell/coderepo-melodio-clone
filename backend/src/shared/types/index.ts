import { Request } from "express";
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

export interface JwtPayload {
	userId: string;
	email: string;
	username: string;
	iat?: number;
	exp?: number;
}
