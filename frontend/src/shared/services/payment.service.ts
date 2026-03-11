import { apiService } from "./api.service";
import type { CardDetails, Payment } from "../types";

export interface PaymentRequest {
	subscriptionPrice: number;
	cardDetails: CardDetails;
}

export interface PaymentResponse {
	success: boolean;
	paymentId: string;
	message: string;
	subscription: {
		plan: string;
		startDate: string;
		endDate: string;
	};
}

export interface PaymentHistoryResponse {
	payments: Payment[];
}

class PaymentService {
	async processCardPayment(
		request: PaymentRequest,
		idempotencyKey: string
	): Promise<PaymentResponse> {
		const url = "/api/payment/card";
		const baseUrl = this.getApiBaseUrl();
		const token = localStorage.getItem("accessToken");

		const response = await fetch(`${baseUrl}${url}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token ? `Bearer ${token}` : "",
				"Idempotency-Key": idempotencyKey,
			},
			body: JSON.stringify(request),
		});

		const data = await response.json();

		if (!response.ok || !data.success) {
			throw new Error(data.error || data.message || "Payment failed");
		}

		return data.data as PaymentResponse;
	}

	async getPaymentHistory(): Promise<PaymentHistoryResponse> {
		return apiService.get<PaymentHistoryResponse>("/api/payments");
	}

	private getApiBaseUrl(): string {
		const { protocol, host } = window.location;
		return `${protocol}//${host.replace("3000", "8000")}`;
	}
}

export const paymentService = new PaymentService();
