import { Response } from "express";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/index.js";

export function sendSuccess<T>(
	res: Response,
	data: T,
	message?: string,
	statusCode = 200,
): Response {
	const response: ApiResponse<T> = {
		success: true,
		data,
		message,
	};
	return res.status(statusCode).json(response);
}

export function sendError(
	res: Response,
	error: string,
	statusCode = 400,
	errors?: Array<{ field: string; message: string }>,
): Response {
	const response: ApiResponse = {
		success: false,
		error,
		errors,
	};
	return res.status(statusCode).json(response);
}

export function calculatePagination<T>(
	items: T[],
	total: number,
	params: PaginationParams,
): PaginatedResponse<T> {
	const page = params.page ?? 1;
	const limit = params.limit ?? 10;
	const totalPages = Math.ceil(total / limit);

	return {
		items,
		total,
		page,
		limit,
		totalPages,
		hasNext: page < totalPages,
		hasPrev: page > 1,
	};
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
	const page = typeof query["page"] === "string" ? parseInt(query["page"], 10) : 1;
	const limit = typeof query["limit"] === "string" ? parseInt(query["limit"], 10) : 10;
	const sortBy = typeof query["sortBy"] === "string" ? query["sortBy"] : "createdAt";
	const sortOrder =
		query["sortOrder"] === "asc" || query["sortOrder"] === "desc"
			? query["sortOrder"]
			: "desc";

	return {
		page: Math.max(1, page),
		limit: Math.min(100, Math.max(1, limit)),
		sortBy,
		sortOrder,
	};
}

export function isValidObjectId(id: string): boolean {
	return /^[0-9a-fA-F]{24}$/.test(id);
}

export function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
