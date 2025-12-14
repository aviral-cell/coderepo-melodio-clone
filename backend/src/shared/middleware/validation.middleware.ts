import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { isValidObjectId, sendError } from "../utils/index.js";

export function validate(validations: ValidationChain[]) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		await Promise.all(validations.map((validation) => validation.run(req)));

		const errors = validationResult(req);
		if (errors.isEmpty()) {
			next();
			return;
		}

		const formattedErrors = errors.array().map((error) => ({
			field: "path" in error ? (error.path as string) : "unknown",
			message: error.msg as string,
		}));

		sendError(res, "Validation failed", 400, formattedErrors);
	};
}

export function validateObjectId(paramName = "id") {
	return (req: Request, res: Response, next: NextFunction): void => {
		const id = req.params[paramName];

		if (!id) {
			sendError(res, `${paramName} parameter is required`, 400);
			return;
		}

		if (!isValidObjectId(id)) {
			sendError(res, `Invalid ${paramName} format`, 400);
			return;
		}

		next();
	};
}

export function validateObjectIds(...paramNames: string[]) {
	return (req: Request, res: Response, next: NextFunction): void => {
		for (const paramName of paramNames) {
			const id = req.params[paramName];

			if (!id) {
				sendError(res, `${paramName} parameter is required`, 400);
				return;
			}

			if (!isValidObjectId(id)) {
				sendError(res, `Invalid ${paramName} format`, 400);
				return;
			}
		}

		next();
	};
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
	if (req.body && typeof req.body === "object") {
		req.body = trimStrings(req.body);
	}
	next();
}

function trimStrings(obj: unknown): unknown {
	if (typeof obj === "string") {
		return obj.trim();
	}

	if (Array.isArray(obj)) {
		return obj.map(trimStrings);
	}

	if (obj !== null && typeof obj === "object") {
		const trimmed: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			trimmed[key] = trimStrings(value);
		}
		return trimmed;
	}

	return obj;
}
