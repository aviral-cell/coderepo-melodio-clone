import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/index.js";

class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode = 400, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.name = "AppError";

		Error.captureStackTrace(this, this.constructor);
	}
}

class ValidationError extends AppError {
	public readonly errors: Array<{ field: string; message: string }>;

	constructor(errors: Array<{ field: string; message: string }>) {
		super("Validation failed", 400);
		this.name = "ValidationError";
		this.errors = errors;
	}
}

export function errorMiddleware(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error("Error:", {
		name: err.name,
		message: err.message,
		stack: process.env["NODE_ENV"] === "development" ? err.stack : undefined,
	});

	if (err instanceof AppError) {
		const response: ApiResponse = {
			success: false,
			error: err.message,
		};

		if (err instanceof ValidationError) {
			response.errors = err.errors;
		}

		res.status(err.statusCode).json(response);
		return;
	}

	if (err.name === "ValidationError") {
		const response: ApiResponse = {
			success: false,
			error: "Validation failed",
			errors: Object.entries(
				(err as unknown as { errors: Record<string, { message: string }> }).errors,
			).map(([field, error]) => ({
				field,
				message: error.message,
			})),
		};
		res.status(400).json(response);
		return;
	}

	if (err.name === "CastError") {
		const response: ApiResponse = {
			success: false,
			error: "Invalid ID format",
		};
		res.status(400).json(response);
		return;
	}

	if ("code" in err && err.code === 11000) {
		const response: ApiResponse = {
			success: false,
			error: "Duplicate entry",
		};
		res.status(409).json(response);
		return;
	}

	const response: ApiResponse = {
		success: false,
		error:
			process.env["NODE_ENV"] === "production"
				? "Internal server error"
				: err.message || "Internal server error",
	};

	res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
	const response: ApiResponse = {
		success: false,
		error: `Route ${req.method} ${req.path} not found`,
	};
	res.status(404).json(response);
}
