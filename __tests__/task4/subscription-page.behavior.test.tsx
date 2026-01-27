// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import SubscriptionPage from "@/pages/SubscriptionPage";
import { PaymentModal } from "@/shared/components/common/PaymentModal";
import { PaymentHistory } from "@/shared/components/common/PaymentHistory";
import type { Subscription, Payment } from "@/shared/types";

// Mock utils
jest.mock("@/shared/utils", () => ({
	formatDuration: (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	},
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock AuthContext
const mockRefreshUser = jest.fn();

jest.mock("@/shared/contexts/AuthContext", () => ({
	useAuth: () => ({
		user: {
			_id: "user-123",
			email: "test@hackerrank.com",
			username: "testuser",
			displayName: "Test User",
			subscriptionStatus: "free",
		},
		isAuthenticated: true,
		isLoading: false,
		refreshUser: mockRefreshUser,
	}),
}));

// Mock ToastContext
const mockAddToast = jest.fn();

jest.mock("@/shared/hooks/useToast", () => ({
	useToast: () => ({
		toasts: [],
		addToast: mockAddToast,
		removeToast: jest.fn(),
	}),
}));

// Constants
const PREMIUM_PRICE = 9.99;

// Factory functions
function createFreeSubscription(): Subscription {
	return {
		_id: "sub-free-123",
		userId: "user-123",
		plan: "free",
		startDate: "2024-01-01T00:00:00Z",
		endDate: null,
		autoRenew: false,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};
}

function createPremiumSubscription(overrides: Partial<Subscription> = {}): Subscription {
	return {
		_id: "sub-premium-456",
		userId: "user-123",
		plan: "premium",
		startDate: "2024-01-15T00:00:00Z",
		endDate: "2024-02-15T00:00:00Z",
		autoRenew: true,
		createdAt: "2024-01-15T00:00:00Z",
		updatedAt: "2024-01-15T00:00:00Z",
		...overrides,
	};
}

function createPayment(overrides: Partial<Payment> = {}): Payment {
	return {
		_id: `payment-${Date.now()}`,
		userId: "user-123",
		amount: PREMIUM_PRICE,
		status: "completed",
		cardLast4: "4242",
		idempotencyKey: "test-key",
		timestamp: "2024-01-15T00:00:00Z",
		createdAt: "2024-01-15T00:00:00Z",
		updatedAt: "2024-01-15T00:00:00Z",
		...overrides,
	};
}

function createApiResponse<T>(data: T) {
	return {
		success: true,
		data,
	};
}

function createApiErrorResponse(error: string) {
	return {
		success: false,
		error,
	};
}

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
	return <MemoryRouter initialEntries={["/subscription"]}>{children}</MemoryRouter>;
}

// Store original values
const originalFetch = global.fetch;
const originalLocation = window.location;
const originalCrypto = global.crypto;

let mockFetch: jest.Mock;

describe("Subscription Page - Behavior Tests", () => {
	beforeAll(() => {
		// Mock window.location for payment service
		delete (window as { location?: Location }).location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/subscription",
			search: "",
			hash: "",
			href: "http://localhost:3000/subscription",
			origin: "http://localhost:3000",
		} as Location;

		// Mock crypto.randomUUID for idempotency key
		Object.defineProperty(global, "crypto", {
			value: {
				randomUUID: () => "test-uuid-12345678",
			},
			writable: true,
		});
	});

	afterAll(() => {
		window.location = originalLocation;
		Object.defineProperty(global, "crypto", { value: originalCrypto, writable: true });
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
		jest.clearAllMocks();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
	});

	// Helper to setup fetch for subscription endpoint
	function setupSubscriptionFetch(subscription: Subscription) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/subscription")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse(subscription)),
				});
			}
			if (url.includes("/api/payments")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({ payments: [] })),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});
	}

	function setupSubscriptionFetchError(errorMessage: string) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/subscription")) {
				return Promise.resolve({
					ok: false,
					status: 500,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiErrorResponse(errorMessage)),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});
	}

	function setupPaymentFetch(payments: Payment[]) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/subscription")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse(createPremiumSubscription())),
				});
			}
			if (url.includes("/api/payments")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({ payments })),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});
	}

	describe("Loading State", () => {
		it("should display skeleton loading state while fetching subscription", async () => {
			// Never resolve to keep loading state
			mockFetch.mockImplementation(() => new Promise(() => {}));

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			// Verify skeleton elements are present (uses animate-pulse class)
			const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
			expect(skeletons.length).toBeGreaterThan(0);
		});
	});

	describe("Free User Subscription Status", () => {
		it("should display Free Plan title for free users", async () => {
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Free Plan")).toBeInTheDocument();
			});
		});

		it("should display Limited features description for free users", async () => {
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Limited features")).toBeInTheDocument();
			});
		});

		it("should display free plan features for free users", async () => {
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Up to 2 playlists")).toBeInTheDocument();
				expect(screen.getByText("No family members")).toBeInTheDocument();
				expect(screen.getByText("Ads between tracks")).toBeInTheDocument();
				expect(screen.getByText("Standard audio quality")).toBeInTheDocument();
			});
		});

		it("should display upgrade button for free users", async () => {
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByTestId("subscription-upgrade-btn")).toBeInTheDocument();
			});

			const upgradeBtn = screen.getByTestId("subscription-upgrade-btn");
			expect(upgradeBtn).toHaveTextContent(`Upgrade to Premium - $${PREMIUM_PRICE}/mo`);
		});

		it("should display Go Premium card with premium features for free users", async () => {
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Go Premium")).toBeInTheDocument();
			});

			// Premium features in Go Premium card
			expect(screen.getByText("Unlimited playlists")).toBeInTheDocument();
			expect(screen.getByText("Add up to 3 family members")).toBeInTheDocument();
			expect(screen.getByText("Ad-free listening")).toBeInTheDocument();
			expect(screen.getByText("Higher audio quality")).toBeInTheDocument();
			expect(screen.getByText("Offline mode")).toBeInTheDocument();
		});

		it("should display Get Premium Now button in Go Premium card for free users", async () => {
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByTestId("subscription-upgrade-premium-btn")).toBeInTheDocument();
			});

			expect(screen.getByTestId("subscription-upgrade-premium-btn")).toHaveTextContent(
				"Get Premium Now"
			);
		});
	});

	describe("Premium User Subscription Status", () => {
		it("should display Premium Plan title for premium users", async () => {
			setupSubscriptionFetch(createPremiumSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Premium Plan")).toBeInTheDocument();
			});
		});

		it("should display monthly price for premium users", async () => {
			setupSubscriptionFetch(createPremiumSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText(`$${PREMIUM_PRICE}/month`)).toBeInTheDocument();
			});
		});

		it("should display subscription start date for premium users", async () => {
			setupSubscriptionFetch(createPremiumSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText(/Started:/)).toBeInTheDocument();
				expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
			});
		});

		it("should display next billing date for premium users with end date", async () => {
			setupSubscriptionFetch(createPremiumSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText(/Next billing:/)).toBeInTheDocument();
				expect(screen.getByText(/February 15, 2024/)).toBeInTheDocument();
			});
		});

		it("should display auto-renewal status for premium users", async () => {
			setupSubscriptionFetch(createPremiumSubscription({ autoRenew: true }));

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText(/Auto-renewal:/)).toBeInTheDocument();
				expect(screen.getByText(/Enabled/)).toBeInTheDocument();
			});
		});

		it("should display premium benefits for premium users", async () => {
			setupSubscriptionFetch(createPremiumSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Your Premium Benefits")).toBeInTheDocument();
			});

			expect(screen.getByText("Unlimited playlists")).toBeInTheDocument();
			expect(screen.getByText("Add up to 3 family members")).toBeInTheDocument();
			expect(screen.getByText("Ad-free listening")).toBeInTheDocument();
		});

		it("should not display upgrade buttons for premium users", async () => {
			setupSubscriptionFetch(createPremiumSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText("Premium Plan")).toBeInTheDocument();
			});

			expect(screen.queryByTestId("subscription-upgrade-btn")).not.toBeInTheDocument();
			expect(screen.queryByTestId("subscription-upgrade-premium-btn")).not.toBeInTheDocument();
		});
	});

	describe("Error Handling", () => {
		it("should display error toast when subscription fetch fails", async () => {
			setupSubscriptionFetchError("Failed to load subscription");

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(mockAddToast).toHaveBeenCalledWith({
					type: "error",
					message: "Failed to load subscription",
				});
			});
		});
	});

	describe("Payment Modal Interaction", () => {
		it("should open payment modal when clicking upgrade button", async () => {
			const user = userEvent.setup();
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByTestId("subscription-upgrade-btn")).toBeInTheDocument();
			});

			await user.click(screen.getByTestId("subscription-upgrade-btn"));

			await waitFor(() => {
				expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
				expect(screen.getByText("Enter your card details to complete the purchase")).toBeInTheDocument();
			});
		});

		it("should open payment modal when clicking Get Premium Now button", async () => {
			const user = userEvent.setup();
			setupSubscriptionFetch(createFreeSubscription());

			render(
				<TestWrapper>
					<SubscriptionPage />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByTestId("subscription-upgrade-premium-btn")).toBeInTheDocument();
			});

			await user.click(screen.getByTestId("subscription-upgrade-premium-btn"));

			await waitFor(() => {
				expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
			});
		});
	});
});

describe("Payment Modal - Behavior Tests", () => {
	const mockOnOpenChange = jest.fn();
	const mockOnSuccess = jest.fn();

	beforeAll(() => {
		delete (window as { location?: Location }).location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/subscription",
			search: "",
			hash: "",
			href: "http://localhost:3000/subscription",
			origin: "http://localhost:3000",
		} as Location;

		Object.defineProperty(global, "crypto", {
			value: {
				randomUUID: () => "test-uuid-12345678",
			},
			writable: true,
		});
	});

	afterAll(() => {
		window.location = originalLocation;
		Object.defineProperty(global, "crypto", { value: originalCrypto, writable: true });
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
		jest.clearAllMocks();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
	});

	function renderPaymentModal(open = true) {
		return render(
			<TestWrapper>
				<PaymentModal
					open={open}
					onOpenChange={mockOnOpenChange}
					onSuccess={mockOnSuccess}
					price={PREMIUM_PRICE}
				/>
			</TestWrapper>
		);
	}

	describe("Modal Visibility", () => {
		it("should render modal when open is true", () => {
			renderPaymentModal(true);

			expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
		});

		it("should not render modal content when open is false", () => {
			renderPaymentModal(false);

			expect(screen.queryByText("Upgrade to Premium")).not.toBeInTheDocument();
		});
	});

	describe("Form Elements", () => {
		it("should display card number input field", () => {
			renderPaymentModal();

			expect(screen.getByTestId("payment-card-number-input")).toBeInTheDocument();
			expect(screen.getByLabelText("Card Number")).toBeInTheDocument();
		});

		it("should display expiry month input field", () => {
			renderPaymentModal();

			expect(screen.getByTestId("payment-expiry-month-input")).toBeInTheDocument();
			expect(screen.getByLabelText("Month (MM)")).toBeInTheDocument();
		});

		it("should display expiry year input field", () => {
			renderPaymentModal();

			expect(screen.getByTestId("payment-expiry-year-input")).toBeInTheDocument();
			expect(screen.getByLabelText("Year (YY)")).toBeInTheDocument();
		});

		it("should display CVV input field", () => {
			renderPaymentModal();

			expect(screen.getByTestId("payment-cvv-input")).toBeInTheDocument();
			expect(screen.getByLabelText("CVV")).toBeInTheDocument();
		});

		it("should display total price", () => {
			renderPaymentModal();

			expect(screen.getByText("Total (monthly)")).toBeInTheDocument();
			expect(screen.getByText(`$${PREMIUM_PRICE.toFixed(2)}`)).toBeInTheDocument();
		});

		it("should display security notice", () => {
			renderPaymentModal();

			expect(screen.getByText("Your payment information is secure")).toBeInTheDocument();
		});

		it("should display cancel and submit buttons", () => {
			renderPaymentModal();

			expect(screen.getByTestId("payment-cancel-btn")).toBeInTheDocument();
			expect(screen.getByTestId("payment-submit-btn")).toBeInTheDocument();
		});

		it("should display correct submit button text with price", () => {
			renderPaymentModal();

			expect(screen.getByTestId("payment-submit-btn")).toHaveTextContent(
				`Pay $${PREMIUM_PRICE.toFixed(2)}`
			);
		});
	});

	describe("Card Number Validation", () => {
		it("should format card number with spaces every 4 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const cardInput = screen.getByTestId("payment-card-number-input");
			await user.type(cardInput, "1234567890123456");

			expect(cardInput).toHaveValue("1234 5678 9012 3456");
		});

		it("should limit card number to 16 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const cardInput = screen.getByTestId("payment-card-number-input");
			await user.type(cardInput, "12345678901234567890");

			// Should be limited to 16 digits with spaces
			expect(cardInput).toHaveValue("1234 5678 9012 3456");
		});

		it("should show error for empty card number on submit", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Card number is required")).toBeInTheDocument();
			});
		});

		it("should show error for card number with less than 16 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const cardInput = screen.getByTestId("payment-card-number-input");
			await user.type(cardInput, "123456789012");
			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Card number must be 16 digits")).toBeInTheDocument();
			});
		});
	});

	describe("Expiry Month Validation", () => {
		it("should show error for empty expiry month on submit", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Expiry month is required")).toBeInTheDocument();
			});
		});

		it("should show error for invalid month (greater than 12)", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const monthInput = screen.getByTestId("payment-expiry-month-input");
			await user.type(monthInput, "13");
			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Invalid month (01-12)")).toBeInTheDocument();
			});
		});

		it("should show error for invalid month (0)", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const monthInput = screen.getByTestId("payment-expiry-month-input");
			await user.type(monthInput, "00");
			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Invalid month (01-12)")).toBeInTheDocument();
			});
		});

		it("should limit expiry month to 2 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const monthInput = screen.getByTestId("payment-expiry-month-input");
			await user.type(monthInput, "123");

			expect(monthInput).toHaveValue("12");
		});
	});

	describe("Expiry Year Validation", () => {
		it("should show error for empty expiry year on submit", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Expiry year is required")).toBeInTheDocument();
			});
		});

		it("should show error for expired year", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const yearInput = screen.getByTestId("payment-expiry-year-input");
			await user.type(yearInput, "20");
			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Card has expired")).toBeInTheDocument();
			});
		});

		it("should limit expiry year to 2 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const yearInput = screen.getByTestId("payment-expiry-year-input");
			await user.type(yearInput, "3099");

			expect(yearInput).toHaveValue("30");
		});
	});

	describe("CVV Validation", () => {
		it("should show error for empty CVV on submit", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("CVV is required")).toBeInTheDocument();
			});
		});

		it("should show error for CVV with less than 3 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const cvvInput = screen.getByTestId("payment-cvv-input");
			await user.type(cvvInput, "12");
			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("CVV must be 3 digits")).toBeInTheDocument();
			});
		});

		it("should limit CVV to 3 digits", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			const cvvInput = screen.getByTestId("payment-cvv-input");
			await user.type(cvvInput, "12345");

			expect(cvvInput).toHaveValue("123");
		});
	});

	describe("Form Submission", () => {
		function setupPaymentSuccess() {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/payment/card")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve({
								success: true,
								data: {
									success: true,
									paymentId: "pay-123",
									transactionId: "txn-456",
									message: "Payment successful",
									subscription: {
										plan: "premium",
										startDate: "2024-01-15T00:00:00Z",
										endDate: "2024-02-15T00:00:00Z",
									},
								},
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});
		}

		function setupPaymentFailure(errorMessage: string) {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/payment/card")) {
					return Promise.resolve({
						ok: false,
						status: 400,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve({
								success: false,
								error: errorMessage,
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});
		}

		it("should submit payment with valid card details", async () => {
			const user = userEvent.setup();
			setupPaymentSuccess();
			renderPaymentModal();

			// Fill form with valid data
			await user.type(screen.getByTestId("payment-card-number-input"), "4242424242424242");
			await user.type(screen.getByTestId("payment-expiry-month-input"), "12");
			await user.type(screen.getByTestId("payment-expiry-year-input"), "30");
			await user.type(screen.getByTestId("payment-cvv-input"), "123");

			await user.click(screen.getByTestId("payment-submit-btn"));

			// Verify API call
			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
				const call = mockFetch.mock.calls.find((c: string[]) =>
					c[0].includes("/api/payment/card")
				);
				expect(call).toBeDefined();
				expect(call[0]).toContain("/api/payment/card");
				expect(call[1].method).toBe("POST");
				expect(call[1].body).toBe(
					JSON.stringify({
						subscriptionPrice: PREMIUM_PRICE,
						cardDetails: {
							cardNumber: "4242424242424242",
							expiryMonth: "12",
							expiryYear: "30",
							cvv: "123",
						},
					})
				);
			});
		});

		it("should include idempotency key in request headers", async () => {
			const user = userEvent.setup();
			setupPaymentSuccess();
			renderPaymentModal();

			await user.type(screen.getByTestId("payment-card-number-input"), "4242424242424242");
			await user.type(screen.getByTestId("payment-expiry-month-input"), "12");
			await user.type(screen.getByTestId("payment-expiry-year-input"), "30");
			await user.type(screen.getByTestId("payment-cvv-input"), "123");

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				const call = mockFetch.mock.calls.find((c: string[]) =>
					c[0].includes("/api/payment/card")
				);
				expect(call).toBeDefined();
				const headers = call[1].headers;
				// Headers could be a Headers instance or plain object depending on how it's passed
				const idempotencyKey =
					headers instanceof Headers
						? headers.get("Idempotency-Key")
						: headers["Idempotency-Key"];
				expect(idempotencyKey).toBe("test-uuid-12345678");
			});
		});

		it("should call onSuccess after successful payment", async () => {
			const user = userEvent.setup();
			setupPaymentSuccess();
			renderPaymentModal();

			await user.type(screen.getByTestId("payment-card-number-input"), "4242424242424242");
			await user.type(screen.getByTestId("payment-expiry-month-input"), "12");
			await user.type(screen.getByTestId("payment-expiry-year-input"), "30");
			await user.type(screen.getByTestId("payment-cvv-input"), "123");

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(mockOnSuccess).toHaveBeenCalledTimes(1);
			});
		});

		it("should show error toast when payment fails", async () => {
			const user = userEvent.setup();
			setupPaymentFailure("Payment declined");
			renderPaymentModal();

			await user.type(screen.getByTestId("payment-card-number-input"), "4242424242424242");
			await user.type(screen.getByTestId("payment-expiry-month-input"), "12");
			await user.type(screen.getByTestId("payment-expiry-year-input"), "30");
			await user.type(screen.getByTestId("payment-cvv-input"), "123");

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(mockAddToast).toHaveBeenCalledWith({
					type: "error",
					message: "Payment declined",
				});
			});
		});

		it("should disable submit button while processing", async () => {
			const user = userEvent.setup();
			// Never resolve to keep loading state
			mockFetch.mockImplementation(() => new Promise(() => {}));
			renderPaymentModal();

			await user.type(screen.getByTestId("payment-card-number-input"), "4242424242424242");
			await user.type(screen.getByTestId("payment-expiry-month-input"), "12");
			await user.type(screen.getByTestId("payment-expiry-year-input"), "30");
			await user.type(screen.getByTestId("payment-cvv-input"), "123");

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("payment-submit-btn")).toBeDisabled();
				expect(screen.getByTestId("payment-submit-btn")).toHaveTextContent("Processing...");
			});
		});

		it("should disable cancel button while processing", async () => {
			const user = userEvent.setup();
			mockFetch.mockImplementation(() => new Promise(() => {}));
			renderPaymentModal();

			await user.type(screen.getByTestId("payment-card-number-input"), "4242424242424242");
			await user.type(screen.getByTestId("payment-expiry-month-input"), "12");
			await user.type(screen.getByTestId("payment-expiry-year-input"), "30");
			await user.type(screen.getByTestId("payment-cvv-input"), "123");

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("payment-cancel-btn")).toBeDisabled();
			});
		});
	});

	describe("Cancel Button", () => {
		it("should call onOpenChange with false when clicking cancel", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-cancel-btn"));

			expect(mockOnOpenChange).toHaveBeenCalledWith(false);
		});
	});

	describe("Error Clearing", () => {
		it("should clear card number error when user starts typing", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			// Submit to trigger error
			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Card number is required")).toBeInTheDocument();
			});

			// Start typing to clear error
			await user.type(screen.getByTestId("payment-card-number-input"), "4");

			await waitFor(() => {
				expect(screen.queryByText("Card number is required")).not.toBeInTheDocument();
			});
		});

		it("should clear expiry month error when user starts typing", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Expiry month is required")).toBeInTheDocument();
			});

			await user.type(screen.getByTestId("payment-expiry-month-input"), "1");

			await waitFor(() => {
				expect(screen.queryByText("Expiry month is required")).not.toBeInTheDocument();
			});
		});

		it("should clear expiry year error when user starts typing", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("Expiry year is required")).toBeInTheDocument();
			});

			await user.type(screen.getByTestId("payment-expiry-year-input"), "3");

			await waitFor(() => {
				expect(screen.queryByText("Expiry year is required")).not.toBeInTheDocument();
			});
		});

		it("should clear CVV error when user starts typing", async () => {
			const user = userEvent.setup();
			renderPaymentModal();

			await user.click(screen.getByTestId("payment-submit-btn"));

			await waitFor(() => {
				expect(screen.getByText("CVV is required")).toBeInTheDocument();
			});

			await user.type(screen.getByTestId("payment-cvv-input"), "1");

			await waitFor(() => {
				expect(screen.queryByText("CVV is required")).not.toBeInTheDocument();
			});
		});
	});
});

describe("Payment History - Behavior Tests", () => {
	beforeAll(() => {
		delete (window as { location?: Location }).location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/subscription",
			search: "",
			hash: "",
			href: "http://localhost:3000/subscription",
			origin: "http://localhost:3000",
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
		jest.clearAllMocks();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
	});

	function setupPaymentHistoryFetch(payments: Payment[]) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/payments")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({ payments })),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});
	}

	function setupPaymentHistoryError(errorMessage: string) {
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/payments")) {
				return Promise.resolve({
					ok: false,
					status: 500,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiErrorResponse(errorMessage)),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});
	}

	function renderPaymentHistory() {
		return render(
			<TestWrapper>
				<PaymentHistory />
			</TestWrapper>
		);
	}

	describe("Loading State", () => {
		it("should display skeleton loading state while fetching payments", async () => {
			mockFetch.mockImplementation(() => new Promise(() => {}));

			renderPaymentHistory();

			// Skeleton uses animate-pulse class
			const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
			expect(skeletons.length).toBeGreaterThan(0);
		});
	});

	describe("Empty State", () => {
		it("should display no payment history message when no payments exist", async () => {
			setupPaymentHistoryFetch([]);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("No payment history yet")).toBeInTheDocument();
			});
		});
	});

	describe("Payments Display", () => {
		it("should display payment history title", async () => {
			setupPaymentHistoryFetch([createPayment()]);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("Payment History")).toBeInTheDocument();
			});
		});

		it("should display payment transactions", async () => {
			const payments = [
				createPayment({ _id: "pay-1", cardLast4: "4242", amount: 9.99, status: "completed" }),
				createPayment({ _id: "pay-2", cardLast4: "1234", amount: 9.99, status: "completed" }),
			];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByTestId("payment-history-item-pay-1")).toBeInTheDocument();
				expect(screen.getByTestId("payment-history-item-pay-2")).toBeInTheDocument();
			});
		});

		it("should display card last 4 digits", async () => {
			const payments = [createPayment({ _id: "pay-1", cardLast4: "4242" })];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText(/\*\*\*\* 4242/)).toBeInTheDocument();
			});
		});

		it("should display payment amount", async () => {
			const payments = [createPayment({ _id: "pay-1", amount: 9.99 })];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("$9.99")).toBeInTheDocument();
			});
		});

		it("should display payment status as Completed", async () => {
			const payments = [createPayment({ _id: "pay-1", status: "completed" })];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("Completed")).toBeInTheDocument();
			});
		});

		it("should display payment status as Failed", async () => {
			const payments = [createPayment({ _id: "pay-1", status: "failed" })];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("Failed")).toBeInTheDocument();
			});
		});

		it("should display payment status as Pending", async () => {
			const payments = [createPayment({ _id: "pay-1", status: "pending" })];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("Pending")).toBeInTheDocument();
			});
		});

		it("should display payment status as Refunded", async () => {
			const payments = [createPayment({ _id: "pay-1", status: "refunded" })];
			setupPaymentHistoryFetch(payments);

			renderPaymentHistory();

			await waitFor(() => {
				expect(screen.getByText("Refunded")).toBeInTheDocument();
			});
		});
	});

	describe("Error Handling", () => {
		it("should display error toast when payment history fetch fails", async () => {
			setupPaymentHistoryError("Failed to load payment history");

			renderPaymentHistory();

			await waitFor(() => {
				expect(mockAddToast).toHaveBeenCalledWith({
					type: "error",
					message: "Failed to load payment history",
				});
			});
		});
	});
});
