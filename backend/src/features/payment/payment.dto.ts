import { ProcessCardPaymentRequest, CardDetails } from "./payment.types.js";

export interface PaymentValidationError {
	field: string;
	message: string;
}

export function validateCardPaymentRequest(
	data: unknown,
): PaymentValidationError[] {
	const errors: PaymentValidationError[] = [];

	if (!data || typeof data !== "object") {
		errors.push({ field: "body", message: "Request body is required" });
		return errors;
	}

	const request = data as Partial<ProcessCardPaymentRequest>;

	if (request.subscriptionPrice === undefined || request.subscriptionPrice === null) {
		errors.push({ field: "subscriptionPrice", message: "Subscription price is required" });
	} else if (typeof request.subscriptionPrice !== "number") {
		errors.push({ field: "subscriptionPrice", message: "Subscription price must be a number" });
	} else if (request.subscriptionPrice < 0.01) {
		errors.push({ field: "subscriptionPrice", message: "Subscription price must be at least 0.01" });
	}

	if (!request.cardDetails) {
		errors.push({ field: "cardDetails", message: "Card details are required" });
		return errors;
	}

	const cardErrors = validateCardDetails(request.cardDetails);
	errors.push(...cardErrors);

	return errors;
}

function validateCardDetails(cardDetails: Partial<CardDetails>): PaymentValidationError[] {
	const errors: PaymentValidationError[] = [];

	if (!cardDetails.cardNumber) {
		errors.push({ field: "cardDetails.cardNumber", message: "Card number is required" });
	} else if (typeof cardDetails.cardNumber !== "string") {
		errors.push({ field: "cardDetails.cardNumber", message: "Card number must be a string" });
	} else if (!/^\d{16}$/.test(cardDetails.cardNumber)) {
		errors.push({ field: "cardDetails.cardNumber", message: "Card number must be exactly 16 digits" });
	}

	if (!cardDetails.expiryMonth) {
		errors.push({ field: "cardDetails.expiryMonth", message: "Expiry month is required" });
	} else if (typeof cardDetails.expiryMonth !== "string") {
		errors.push({ field: "cardDetails.expiryMonth", message: "Expiry month must be a string" });
	} else if (!/^(0[1-9]|1[0-2])$/.test(cardDetails.expiryMonth)) {
		errors.push({ field: "cardDetails.expiryMonth", message: "Expiry month must be between 01 and 12" });
	}

	if (!cardDetails.expiryYear) {
		errors.push({ field: "cardDetails.expiryYear", message: "Expiry year is required" });
	} else if (typeof cardDetails.expiryYear !== "string") {
		errors.push({ field: "cardDetails.expiryYear", message: "Expiry year must be a string" });
	} else if (!/^\d{2}$/.test(cardDetails.expiryYear)) {
		errors.push({ field: "cardDetails.expiryYear", message: "Expiry year must be exactly 2 digits" });
	} else {
		const expiryError = validateExpiryDate(cardDetails.expiryMonth!, cardDetails.expiryYear);
		if (expiryError) {
			errors.push(expiryError);
		}
	}

	if (!cardDetails.cvv) {
		errors.push({ field: "cardDetails.cvv", message: "CVV is required" });
	} else if (typeof cardDetails.cvv !== "string") {
		errors.push({ field: "cardDetails.cvv", message: "CVV must be a string" });
	} else if (!/^\d{3}$/.test(cardDetails.cvv)) {
		errors.push({ field: "cardDetails.cvv", message: "CVV must be exactly 3 digits" });
	}

	return errors;
}

function validateExpiryDate(
	_expiryMonth: string,
	_expiryYear: string,
): PaymentValidationError | null {
	return null;
}
