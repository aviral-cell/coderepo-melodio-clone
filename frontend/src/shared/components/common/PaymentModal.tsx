import { useState, useCallback } from "react";
import { CreditCard, Lock } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useToast } from "@/shared/hooks/useToast";
import { paymentService } from "@/shared/services/payment.service";

interface PaymentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	price: number;
}

interface FormErrors {
	cardNumber?: string;
	expiryMonth?: string;
	expiryYear?: string;
	cvv?: string;
}

function validateCardNumber(value: string): string | undefined {
	const cleaned = value.replace(/\s/g, "");
	if (!cleaned) return "Card number is required";
	if (!/^\d+$/.test(cleaned)) return "Card number must contain only digits";
	if (cleaned.length !== 16) return "Card number must be 16 digits";
	return undefined;
}

function validateExpiryMonth(value: string): string | undefined {
	if (!value) return "Expiry month is required";
	const month = parseInt(value, 10);
	if (isNaN(month) || month < 1 || month > 12)
		return "Invalid month (01-12)";
	return undefined;
}

function validateExpiryYear(value: string): string | undefined {
	if (!value) return "Expiry year is required";
	if (!/^\d{2}$/.test(value)) return "Invalid year (YY format)";
	const year = parseInt(value, 10);
	const currentYear = new Date().getFullYear() % 100;
	if (year < currentYear) return "Card has expired";
	return undefined;
}

function validateCvv(value: string): string | undefined {
	if (!value) return "CVV is required";
	if (!/^\d{3}$/.test(value)) return "CVV must be 3 digits";
	return undefined;
}

function formatCardNumber(value: string): string {
	const cleaned = value.replace(/\D/g, "").slice(0, 16);
	const groups = cleaned.match(/.{1,4}/g);
	return groups ? groups.join(" ") : cleaned;
}

export function PaymentModal({
	open,
	onOpenChange,
	onSuccess,
	price,
}: PaymentModalProps) {
	const { addToast } = useToast();

	const [cardNumber, setCardNumber] = useState("");
	const [expiryMonth, setExpiryMonth] = useState("");
	const [expiryYear, setExpiryYear] = useState("");
	const [cvv, setCvv] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = useCallback(() => {
		setCardNumber("");
		setExpiryMonth("");
		setExpiryYear("");
		setCvv("");
		setErrors({});
	}, []);

	const handleClose = useCallback(() => {
		if (!isSubmitting) {
			resetForm();
			onOpenChange(false);
		}
	}, [isSubmitting, resetForm, onOpenChange]);

	const validateForm = useCallback((): boolean => {
		const cleanedCardNumber = cardNumber.replace(/\s/g, "");
		const newErrors: FormErrors = {
			cardNumber: validateCardNumber(cleanedCardNumber),
			expiryMonth: validateExpiryMonth(expiryMonth),
			expiryYear: validateExpiryYear(expiryYear),
			cvv: validateCvv(cvv),
		};

		if (!newErrors.expiryMonth && !newErrors.expiryYear) {
			const now = new Date();
			const currentYear = now.getFullYear() % 100;
			const currentMonth = now.getMonth() + 1;
			const year = parseInt(expiryYear, 10);
			const month = parseInt(expiryMonth, 10);

			if (year === currentYear && month < currentMonth) {
				newErrors.expiryMonth = "Card has expired";
			}
		}

		setErrors(newErrors);
		return !Object.values(newErrors).some(Boolean);
	}, [cardNumber, expiryMonth, expiryYear, cvv]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!validateForm()) {
				return;
			}

			setIsSubmitting(true);

			try {
				const idempotencyKey = crypto.randomUUID();
				const cleanedCardNumber = cardNumber.replace(/\s/g, "");

				await paymentService.processCardPayment(
					{
						subscriptionPrice: price,
						cardDetails: {
							cardNumber: cleanedCardNumber,
							expiryMonth: expiryMonth.padStart(2, "0"),
							expiryYear: expiryYear,
							cvv,
						},
					},
					idempotencyKey
				);

				resetForm();
				onSuccess();
			} catch (error) {
				addToast({
					type: "error",
					message:
						error instanceof Error ? error.message : "Payment failed",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			validateForm,
			cardNumber,
			expiryMonth,
			expiryYear,
			cvv,
			price,
			resetForm,
			onSuccess,
			addToast,
		]
	);

	const handleCardNumberChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const formatted = formatCardNumber(e.target.value);
			setCardNumber(formatted);
			if (errors.cardNumber) {
				setErrors((prev) => ({ ...prev, cardNumber: undefined }));
			}
		},
		[errors.cardNumber]
	);

	const handleExpiryMonthChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.replace(/\D/g, "").slice(0, 2);
			setExpiryMonth(value);
			if (errors.expiryMonth) {
				setErrors((prev) => ({ ...prev, expiryMonth: undefined }));
			}
		},
		[errors.expiryMonth]
	);

	const handleExpiryYearChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.replace(/\D/g, "").slice(0, 2);
			setExpiryYear(value);
			if (errors.expiryYear) {
				setErrors((prev) => ({ ...prev, expiryYear: undefined }));
			}
		},
		[errors.expiryYear]
	);

	const handleCvvChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.replace(/\D/g, "").slice(0, 3);
			setCvv(value);
			if (errors.cvv) {
				setErrors((prev) => ({ ...prev, cvv: undefined }));
			}
		},
		[errors.cvv]
	);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-white">
						<CreditCard className="h-5 w-5 text-melodio-green" />
						Upgrade to Premium
					</DialogTitle>
					<DialogDescription>
						Enter your card details to complete the purchase
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label
								htmlFor="card-number"
								className="text-sm font-medium text-white"
							>
								Card Number
							</label>
							<Input
								id="card-number"
								type="text"
								placeholder="1234 5678 9012 3456"
								value={cardNumber}
								onChange={handleCardNumberChange}
								className={`bg-melodio-light-gray ${
									errors.cardNumber ? "border-red-500" : ""
								}`}
								autoComplete="cc-number"
								data-testid="payment-card-number-input"
							/>
							{errors.cardNumber && (
								<p className="text-xs text-red-500">{errors.cardNumber}</p>
							)}
						</div>

						{/* Expiry Date */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label
									htmlFor="expiry-month"
									className="text-sm font-medium text-white"
								>
									Month (MM)
								</label>
								<Input
									id="expiry-month"
									type="text"
									placeholder="MM"
									value={expiryMonth}
									onChange={handleExpiryMonthChange}
									className={`bg-melodio-light-gray ${
										errors.expiryMonth ? "border-red-500" : ""
									}`}
									autoComplete="cc-exp-month"
									data-testid="payment-expiry-month-input"
								/>
								{errors.expiryMonth && (
									<p className="text-xs text-red-500">{errors.expiryMonth}</p>
								)}
							</div>
							<div className="space-y-2">
								<label
									htmlFor="expiry-year"
									className="text-sm font-medium text-white"
								>
									Year (YY)
								</label>
								<Input
									id="expiry-year"
									type="text"
									placeholder="YY"
									value={expiryYear}
									onChange={handleExpiryYearChange}
									className={`bg-melodio-light-gray ${
										errors.expiryYear ? "border-red-500" : ""
									}`}
									autoComplete="cc-exp-year"
									data-testid="payment-expiry-year-input"
								/>
								{errors.expiryYear && (
									<p className="text-xs text-red-500">{errors.expiryYear}</p>
								)}
							</div>
						</div>

						{/* CVV */}
						<div className="space-y-2">
							<label
								htmlFor="cvv"
								className="text-sm font-medium text-white"
							>
								CVV
							</label>
							<Input
								id="cvv"
								type="text"
								placeholder="123"
								value={cvv}
								onChange={handleCvvChange}
								className={`bg-melodio-light-gray ${
									errors.cvv ? "border-red-500" : ""
								}`}
								autoComplete="cc-csc"
								data-testid="payment-cvv-input"
							/>
							{errors.cvv && (
								<p className="text-xs text-red-500">{errors.cvv}</p>
							)}
						</div>

						{/* Total */}
						<div className="flex items-center justify-between rounded-md bg-melodio-light-gray p-3">
							<span className="text-sm text-melodio-text-subdued">
								Total (monthly)
							</span>
							<span className="text-lg font-bold text-white">
								${price.toFixed(2)}
							</span>
						</div>

						{/* Security Notice */}
						<div className="flex items-center gap-2 text-xs text-melodio-text-subdued">
							<Lock className="h-3 w-3" />
							<span>Your payment information is secure</span>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isSubmitting}
							data-testid="payment-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-melodio-green text-black hover:bg-melodio-green/90"
							data-testid="payment-submit-btn"
						>
							{isSubmitting ? "Processing..." : `Pay $${price.toFixed(2)}`}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
