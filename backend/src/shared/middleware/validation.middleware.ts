import { Request, Response, NextFunction } from "express";

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
