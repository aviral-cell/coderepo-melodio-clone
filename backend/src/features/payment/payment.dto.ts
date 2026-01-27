import { ProcessCardPaymentRequest, CardDetails } from "./payment.types.js";

export interface PaymentValidationError {
	field: string;
	message: string;
}

/**
 * Validate card payment request.
 * Returns array of validation errors (empty if valid).
 */
export function validateCardPaymentRequest(
	data: unknown,
): PaymentValidationError[] {
	const errors: PaymentValidationError[] = [];

	if (!data || typeof data !== "object") {
		errors.push({ field: "body", message: "Request body is required" });
		return errors;
	}

	const request = data as Partial<ProcessCardPaymentRequest>;

	// Validate subscriptionPrice
	if (request.subscriptionPrice === undefined || request.subscriptionPrice === null) {
		errors.push({ field: "subscriptionPrice", message: "Subscription price is required" });
	} else if (typeof request.subscriptionPrice !== "number") {
		errors.push({ field: "subscriptionPrice", message: "Subscription price must be a number" });
	} else if (request.subscriptionPrice < 0.01) {
		errors.push({ field: "subscriptionPrice", message: "Subscription price must be at least 0.01" });
	}

	// Validate cardDetails object
	if (!request.cardDetails) {
		errors.push({ field: "cardDetails", message: "Card details are required" });
		return errors;
	}

	const cardErrors = validateCardDetails(request.cardDetails);
	errors.push(...cardErrors);

	return errors;
}

/**
 * Validate card details.
 */
function validateCardDetails(cardDetails: Partial<CardDetails>): PaymentValidationError[] {
	const errors: PaymentValidationError[] = [];

	// Validate cardNumber - must be exactly 16 digits
	if (!cardDetails.cardNumber) {
		errors.push({ field: "cardDetails.cardNumber", message: "Card number is required" });
	} else if (typeof cardDetails.cardNumber !== "string") {
		errors.push({ field: "cardDetails.cardNumber", message: "Card number must be a string" });
	} else if (!/^\d{16}$/.test(cardDetails.cardNumber)) {
		errors.push({ field: "cardDetails.cardNumber", message: "Card number must be exactly 16 digits" });
	}

	// Validate expiryMonth - must be 01-12
	if (!cardDetails.expiryMonth) {
		errors.push({ field: "cardDetails.expiryMonth", message: "Expiry month is required" });
	} else if (typeof cardDetails.expiryMonth !== "string") {
		errors.push({ field: "cardDetails.expiryMonth", message: "Expiry month must be a string" });
	} else if (!/^(0[1-9]|1[0-2])$/.test(cardDetails.expiryMonth)) {
		errors.push({ field: "cardDetails.expiryMonth", message: "Expiry month must be between 01 and 12" });
	}

	// Validate expiryYear - must be 2 digits and future
	if (!cardDetails.expiryYear) {
		errors.push({ field: "cardDetails.expiryYear", message: "Expiry year is required" });
	} else if (typeof cardDetails.expiryYear !== "string") {
		errors.push({ field: "cardDetails.expiryYear", message: "Expiry year must be a string" });
	} else if (!/^\d{2}$/.test(cardDetails.expiryYear)) {
		errors.push({ field: "cardDetails.expiryYear", message: "Expiry year must be exactly 2 digits" });
	} else {
		// Check if the card is not expired
		const expiryError = validateExpiryDate(cardDetails.expiryMonth!, cardDetails.expiryYear);
		if (expiryError) {
			errors.push(expiryError);
		}
	}

	// Validate cvv - must be exactly 3 digits
	if (!cardDetails.cvv) {
		errors.push({ field: "cardDetails.cvv", message: "CVV is required" });
	} else if (typeof cardDetails.cvv !== "string") {
		errors.push({ field: "cardDetails.cvv", message: "CVV must be a string" });
	} else if (!/^\d{3}$/.test(cardDetails.cvv)) {
		errors.push({ field: "cardDetails.cvv", message: "CVV must be exactly 3 digits" });
	}

	return errors;
}

/**
 * Validate that the expiry date is in the future.
 */
function validateExpiryDate(
	expiryMonth: string,
	expiryYear: string,
): PaymentValidationError | null {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear() % 100;
	const currentMonth = currentDate.getMonth() + 1;

	const expYear = parseInt(expiryYear, 10);
	const expMonth = parseInt(expiryMonth, 10);

	if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
		return { field: "cardDetails.expiryYear", message: "Card has expired" };
	}

	return null;
}
