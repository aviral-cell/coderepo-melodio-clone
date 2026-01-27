export interface FamilyMemberDto {
	name: string;
	email: string;
	age?: number;
}

export interface FamilyMemberValidationError {
	field: string;
	message: string;
}

/**
 * Validate family member creation request.
 * Returns array of validation errors (empty if valid).
 */
export function validateFamilyMemberRequest(
	data: unknown,
): FamilyMemberValidationError[] {
	const errors: FamilyMemberValidationError[] = [];

	if (!data || typeof data !== "object") {
		errors.push({ field: "body", message: "Request body is required" });
		return errors;
	}

	const request = data as Partial<FamilyMemberDto>;

	// Validate name - required, 2-50 characters
	if (!request.name) {
		errors.push({ field: "name", message: "Name is required" });
	} else if (typeof request.name !== "string") {
		errors.push({ field: "name", message: "Name must be a string" });
	} else {
		const trimmedName = request.name.trim();
		if (trimmedName.length < 2) {
			errors.push({ field: "name", message: "Name must be at least 2 characters" });
		} else if (trimmedName.length > 50) {
			errors.push({ field: "name", message: "Name must be at most 50 characters" });
		}
	}

	// Validate email - required, valid email format
	if (!request.email) {
		errors.push({ field: "email", message: "Email is required" });
	} else if (typeof request.email !== "string") {
		errors.push({ field: "email", message: "Email must be a string" });
	} else {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(request.email)) {
			errors.push({ field: "email", message: "Invalid email format" });
		}
	}

	// Validate age - optional, must be a number if provided
	if (request.age !== undefined && request.age !== null) {
		if (typeof request.age !== "number") {
			errors.push({ field: "age", message: "Age must be a number" });
		} else if (request.age < 0) {
			errors.push({ field: "age", message: "Age must be a positive number" });
		}
	}

	return errors;
}
