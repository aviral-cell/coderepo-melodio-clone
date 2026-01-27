/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";

const config: Config = loadConfig(true);

const AUTH_BASE = "/api/auth";
const PAYMENT_BASE = "/api/payment";

enum AccountType {
	PRIMARY = "primary",
	FAMILY_MEMBER = "family_member",
}

enum SubscriptionStatus {
	FREE = "free",
	PREMIUM = "premium",
}

enum SubscriptionPlan {
	FREE = "free",
	PREMIUM = "premium",
}

enum PaymentStatus {
	PENDING = "pending",
	COMPLETED = "completed",
	FAILED = "failed",
	REFUNDED = "refunded",
}

interface IUser {
	email: string;
	username: string;
	password_hash: string;
	display_name: string;
	avatar_url?: string;
	account_type: AccountType;
	primary_account_id: mongoose.Types.ObjectId | null;
	is_active: boolean;
	subscription_status: SubscriptionStatus;
	created_at: Date;
	updated_at: Date;
}

interface IUserDocument extends IUser, Document {
	_id: mongoose.Types.ObjectId;
}

interface ISubscription {
	user_id: mongoose.Types.ObjectId;
	plan: SubscriptionPlan;
	start_date: Date;
	end_date: Date | null;
	auto_renew: boolean;
	created_at: Date;
	updated_at: Date;
}

interface ISubscriptionDocument extends ISubscription, Document {
	_id: mongoose.Types.ObjectId;
}

interface IPayment {
	user_id: mongoose.Types.ObjectId;
	amount: number;
	status: PaymentStatus;
	card_last4: string;
	idempotency_key: string | null;
	timestamp: Date;
	created_at: Date;
	updated_at: Date;
}

interface IPaymentDocument extends IPayment, Document {
	_id: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
	{
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		username: { type: String, required: true, unique: true, trim: true },
		password_hash: { type: String, required: false, select: false },
		display_name: { type: String, required: true, trim: true },
		avatar_url: { type: String },
		account_type: {
			type: String,
			enum: Object.values(AccountType),
			default: AccountType.PRIMARY,
		},
		primary_account_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		is_active: { type: Boolean, default: true },
		subscription_status: {
			type: String,
			enum: Object.values(SubscriptionStatus),
			default: SubscriptionStatus.FREE,
		},
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const subscriptionSchema = new Schema<ISubscriptionDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		plan: {
			type: String,
			enum: Object.values(SubscriptionPlan),
			default: SubscriptionPlan.FREE,
			required: true,
		},
		start_date: { type: Date, required: true },
		end_date: { type: Date, default: null },
		auto_renew: { type: Boolean, default: false },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const paymentSchema = new Schema<IPaymentDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		amount: { type: Number, required: true, min: 0.01 },
		status: {
			type: String,
			enum: Object.values(PaymentStatus),
			default: PaymentStatus.PENDING,
		},
		card_last4: { type: String, required: true, minlength: 4, maxlength: 4 },
		idempotency_key: { type: String, default: null },
		timestamp: { type: Date, required: true },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

let User: Model<IUserDocument>;
let Subscription: Model<ISubscriptionDocument>;
let Payment: Model<IPaymentDocument>;
let app: Application;

const testUser = {
	email: "subscription-test@hackerrank.com",
	username: "subscriptiontestuser",
	password: "Password123!",
	displayName: "Subscription Test User",
};

function createValidCardDetails(): {
	cardNumber: string;
	expiryMonth: string;
	expiryYear: string;
	cvv: string;
} {
	const currentDate = new Date();
	const futureYear = ((currentDate.getFullYear() % 100) + 2).toString().padStart(2, "0");

	return {
		cardNumber: "4111111111111111",
		expiryMonth: "12",
		expiryYear: futureYear,
		cvv: "123",
	};
}

function createExpiredCardDetails(): {
	cardNumber: string;
	expiryMonth: string;
	expiryYear: string;
	cvv: string;
} {
	const currentDate = new Date();
	const pastYear = ((currentDate.getFullYear() % 100) - 1).toString().padStart(2, "0");

	return {
		cardNumber: "4111111111111111",
		expiryMonth: "01",
		expiryYear: pastYear,
		cvv: "123",
	};
}

function createValidPaymentRequest(
	subscriptionPrice = 9.99,
): { subscriptionPrice: number; cardDetails: ReturnType<typeof createValidCardDetails> } {
	return {
		subscriptionPrice,
		cardDetails: createValidCardDetails(),
	};
}

describe("Subscription & Payment API", () => {
	let authToken: string;
	let userId: string;

	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Subscription =
			mongoose.models.Subscription ||
			mongoose.model<ISubscriptionDocument>("Subscription", subscriptionSchema);
		Payment = mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", paymentSchema);

		app = createApp();

		await User.deleteMany({ email: { $regex: /subscription-test/i } });
		await Subscription.deleteMany({});
		await Payment.deleteMany({});

		await request(app).post(`${AUTH_BASE}/register`).send(testUser);

		const loginRes = await request(app).post(`${AUTH_BASE}/login`).send({
			email: testUser.email,
			password: testUser.password,
		});

		authToken = loginRes.body.data.accessToken;

		const user = await User.findOne({ email: testUser.email });
		userId = user?._id.toString() || "";
	});

	afterAll(async () => {
		await User.deleteMany({ email: { $regex: /subscription-test/i } });
		await Subscription.deleteMany({});
		await Payment.deleteMany({});
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await Subscription.deleteMany({});
		await Payment.deleteMany({});
		await User.updateOne(
			{ _id: new mongoose.Types.ObjectId(userId) },
			{ $set: { subscription_status: SubscriptionStatus.FREE } },
		);
	});

	describe("POST /api/payment/card", () => {
		describe("Success Cases", () => {
			it("should process payment successfully with correct subscriptionPrice", async () => {
				const paymentRequest = createValidPaymentRequest(9.99);

				const res = await request(app)
					.post(`${PAYMENT_BASE}/card`)
					.set("Authorization", `Bearer ${authToken}`)
					.send(paymentRequest);

				expect(res.status).toBe(200);
				expect(res.body.success).toBe(true);
				expect(res.body.data).toBeDefined();
				expect(res.body.data.success).toBe(true);
				expect(res.body.data.paymentId).toBeDefined();
			});

			it("should create payment record with correct amount", async () => {
				const paymentRequest = createValidPaymentRequest(14.99);

				const res = await request(app)
					.post(`${PAYMENT_BASE}/card`)
					.set("Authorization", `Bearer ${authToken}`)
					.send(paymentRequest);

				expect(res.status).toBe(200);
				expect(res.body.success).toBe(true);

				const payment = await Payment.findById(res.body.data.paymentId);
				expect(payment).not.toBeNull();
				expect(payment?.amount).toBe(14.99);
			});
		});

		describe("Card Validation", () => {
			it("should reject payment with expired card", async () => {
				const paymentRequest = {
					subscriptionPrice: 9.99,
					cardDetails: createExpiredCardDetails(),
				};

				const res = await request(app)
					.post(`${PAYMENT_BASE}/card`)
					.set("Authorization", `Bearer ${authToken}`)
					.send(paymentRequest);

				expect(res.status).toBe(400);
				expect(res.body.success).toBe(false);
				expect(res.body.message).toMatch(/validation.*failed/i);
				expect(res.body.details).toBeDefined();
				expect(Array.isArray(res.body.details)).toBe(true);

				const hasExpiryError = res.body.details.some(
					(e: { field: string; message: string }) =>
						e.field.toLowerCase().includes("expiry") && e.message.toLowerCase().includes("expired"),
				);
				expect(hasExpiryError).toBe(true);
			});
		});

		describe("Idempotency (duplicate payment prevention)", () => {
			it("should return cached result for same idempotency key", async () => {
				const paymentRequest = createValidPaymentRequest();
				const idempotencyKey = `test-idempotency-${Date.now()}`;

				const res1 = await request(app)
					.post(`${PAYMENT_BASE}/card`)
					.set("Authorization", `Bearer ${authToken}`)
					.set("Idempotency-Key", idempotencyKey)
					.send(paymentRequest);

				expect(res1.status).toBe(200);
				expect(res1.body.success).toBe(true);

				const firstPaymentId = res1.body.data.paymentId;

				const res2 = await request(app)
					.post(`${PAYMENT_BASE}/card`)
					.set("Authorization", `Bearer ${authToken}`)
					.set("Idempotency-Key", idempotencyKey)
					.send(paymentRequest);

				expect(res2.status).toBe(200);
				expect(res2.body.success).toBe(true);
				expect(res2.body.data.paymentId).toBe(firstPaymentId);
			});

			it("should not double-charge when same idempotency key is reused (rapid double-click)", async () => {
				const paymentRequest = createValidPaymentRequest();
				const idempotencyKey = `test-rapid-click-${Date.now()}`;

				const [res1, res2] = await Promise.all([
					request(app)
						.post(`${PAYMENT_BASE}/card`)
						.set("Authorization", `Bearer ${authToken}`)
						.set("Idempotency-Key", idempotencyKey)
						.send(paymentRequest),
					new Promise<request.Response>((resolve) => {
						setTimeout(async () => {
							const response = await request(app)
								.post(`${PAYMENT_BASE}/card`)
								.set("Authorization", `Bearer ${authToken}`)
								.set("Idempotency-Key", idempotencyKey)
								.send(paymentRequest);
							resolve(response);
						}, 50);
					}),
				]);

				expect(res1.status).toBe(200);
				expect(res2.status).toBe(200);
				expect(res1.body.success).toBe(true);
				expect(res2.body.success).toBe(true);

				expect(res1.body.data.paymentId).toBe(res2.body.data.paymentId);

				const payments = await Payment.find({
					idempotency_key: idempotencyKey,
				});
				expect(payments).toHaveLength(1);
			});
		});
	});

	describe("Post-Payment Updates", () => {
		it("should upgrade subscription plan to premium after payment", async () => {
			const paymentRequest = createValidPaymentRequest(9.99);

			const res = await request(app)
				.post(`${PAYMENT_BASE}/card`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(paymentRequest);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.subscription).toBeDefined();
			expect(res.body.data.subscription.plan).toBe(SubscriptionPlan.PREMIUM);

			const subscription = await Subscription.findOne({
				user_id: new mongoose.Types.ObjectId(userId),
			});
			expect(subscription).not.toBeNull();
			expect(subscription?.plan).toBe(SubscriptionPlan.PREMIUM);
		});

		it("should update user subscription_status to premium after payment", async () => {
			const paymentRequest = createValidPaymentRequest(9.99);

			const res = await request(app)
				.post(`${PAYMENT_BASE}/card`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(paymentRequest);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const user = await User.findById(userId);
			expect(user).not.toBeNull();
			expect(user?.subscription_status).toBe(SubscriptionStatus.PREMIUM);
		});

		it("should update payment status to completed after processing", async () => {
			const paymentRequest = createValidPaymentRequest(9.99);

			const res = await request(app)
				.post(`${PAYMENT_BASE}/card`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(paymentRequest);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const payment = await Payment.findById(res.body.data.paymentId);
			expect(payment).not.toBeNull();
			expect(payment?.status).toBe(PaymentStatus.COMPLETED);
		});
	});
});
