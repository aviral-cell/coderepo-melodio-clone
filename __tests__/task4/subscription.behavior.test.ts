/**
 * @jest-environment node
 *
 * Behavioral tests for Task 4 - Premium Subscription & Payment Features
 *
 * Tests the complete subscription and payment flows as a QA engineer would
 * manually test them, using real MongoDB and the actual Express app.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { Application } from 'express';
import { createApp } from '../../backend/src/app';
import { loadConfig, Config } from '../../backend/src/shared/config';

// Load test configuration
const config: Config = loadConfig(true);

// API endpoints
const AUTH_BASE = '/api/auth';
const SUBSCRIPTION_BASE = '/api/subscription';
const PAYMENT_BASE = '/api/payment';

// ============================================================================
// Type Definitions (Self-contained - no imports from source)
// ============================================================================

enum AccountType {
  PRIMARY = 'primary',
  FAMILY_MEMBER = 'family_member',
}

enum SubscriptionStatus {
  FREE = 'free',
  PREMIUM = 'premium',
}

enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium',
}

enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
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

// ============================================================================
// Mongoose Schemas (Self-contained)
// ============================================================================

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
      ref: 'User',
      default: null,
    },
    is_active: { type: Boolean, default: true },
    subscription_status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.FREE,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

const paymentSchema = new Schema<IPaymentDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

// ============================================================================
// Test Models (initialized in beforeAll)
// ============================================================================

let User: Model<IUserDocument>;
let Subscription: Model<ISubscriptionDocument>;
let Payment: Model<IPaymentDocument>;
let app: Application;

// ============================================================================
// Test Fixtures
// ============================================================================

const testUser = {
  email: 'subscription-test@hackerrank.com',
  username: 'subscriptiontestuser',
  password: 'Password123!',
  displayName: 'Subscription Test User',
};

const secondTestUser = {
  email: 'subscription-test2@hackerrank.com',
  username: 'subscriptiontestuser2',
  password: 'Password123!',
  displayName: 'Subscription Test User 2',
};

// Valid card details for testing
function createValidCardDetails(): {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
} {
  const currentDate = new Date();
  const futureYear = ((currentDate.getFullYear() % 100) + 2).toString().padStart(2, '0');

  return {
    cardNumber: '4111111111111111',
    expiryMonth: '12',
    expiryYear: futureYear,
    cvv: '123',
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

// ============================================================================
// Test Suite
// ============================================================================

describe('Subscription & Payment Features', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(config.mongodbUri);

    // Initialize models (use existing or create new)
    User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
    Subscription =
      mongoose.models.Subscription ||
      mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);
    Payment = mongoose.models.Payment || mongoose.model<IPaymentDocument>('Payment', paymentSchema);

    // Create Express app
    app = createApp();

    // Clean up test data
    await User.deleteMany({ email: { $regex: /subscription-test/i } });
    await Subscription.deleteMany({});
    await Payment.deleteMany({});

    // Register test user
    await request(app).post(`${AUTH_BASE}/register`).send(testUser);

    // Login to get auth token
    const loginRes = await request(app).post(`${AUTH_BASE}/login`).send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.data.accessToken;

    // Get user ID from database
    const user = await User.findOne({ email: testUser.email });
    userId = user?._id.toString() || '';
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /subscription-test/i } });
    await Subscription.deleteMany({});
    await Payment.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clean subscriptions and payments before each test for isolation
    await Subscription.deleteMany({});
    await Payment.deleteMany({});
  });

  // ==========================================================================
  // Subscription Controller Tests
  // ==========================================================================

  describe('Subscription Controller', () => {
    describe('GET /api/subscription', () => {
      it('should return free subscription for new user when no subscription exists', async () => {
        const res = await request(app)
          .get(SUBSCRIPTION_BASE)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.plan).toBe(SubscriptionPlan.FREE);
        expect(res.body.data.userId).toBe(userId);
        expect(res.body.data.autoRenew).toBe(false);
        expect(res.body.data.endDate).toBeNull();
      });

      it('should return existing subscription when user already has one', async () => {
        // Create a subscription directly in the database
        const subscription = await Subscription.create({
          user_id: new mongoose.Types.ObjectId(userId),
          plan: SubscriptionPlan.PREMIUM,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          auto_renew: true,
        });

        const res = await request(app)
          .get(SUBSCRIPTION_BASE)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.plan).toBe(SubscriptionPlan.PREMIUM);
        expect(res.body.data._id).toBe(subscription._id.toString());
        expect(res.body.data.autoRenew).toBe(true);
        expect(res.body.data.endDate).not.toBeNull();
      });

      it('should return 401 when no authorization header is provided', async () => {
        const res = await request(app).get(SUBSCRIPTION_BASE);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return 401 when invalid token is provided', async () => {
        const res = await request(app)
          .get(SUBSCRIPTION_BASE)
          .set('Authorization', 'Bearer invalid-token-here');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return 401 when authorization header format is incorrect', async () => {
        const res = await request(app)
          .get(SUBSCRIPTION_BASE)
          .set('Authorization', authToken); // Missing "Bearer " prefix

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return subscription with correct date formats (ISO strings)', async () => {
        const res = await request(app)
          .get(SUBSCRIPTION_BASE)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(res.body.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(res.body.data.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });

  // ==========================================================================
  // Payment Controller Tests
  // ==========================================================================

  describe('Payment Controller', () => {
    describe('POST /api/payment/card', () => {
      it('should process card payment and upgrade subscription to premium', async () => {
        const paymentRequest = createValidPaymentRequest();

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentRequest);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.success).toBe(true);
        expect(res.body.data.paymentId).toBeDefined();
        expect(res.body.data.transactionId).toBeDefined();
        expect(res.body.data.message).toBe('Payment successful');
        expect(res.body.data.subscription).toBeDefined();
        expect(res.body.data.subscription.plan).toBe(SubscriptionPlan.PREMIUM);

        // Verify subscription was upgraded in database
        const subscription = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        expect(subscription).not.toBeNull();
        expect(subscription?.plan).toBe(SubscriptionPlan.PREMIUM);
        expect(subscription?.auto_renew).toBe(true);
        expect(subscription?.end_date).not.toBeNull();

        // Verify payment record was created
        const payment = await Payment.findById(res.body.data.paymentId);
        expect(payment).not.toBeNull();
        expect(payment?.status).toBe(PaymentStatus.COMPLETED);
        expect(payment?.card_last4).toBe('1111');
        expect(payment?.amount).toBe(paymentRequest.subscriptionPrice);
      });

      it('should return 401 when no authorization header is provided', async () => {
        const paymentRequest = createValidPaymentRequest();

        const res = await request(app).post(`${PAYMENT_BASE}/card`).send(paymentRequest);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return 401 when invalid token is provided', async () => {
        const paymentRequest = createValidPaymentRequest();

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', 'Bearer invalid-token')
          .send(paymentRequest);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return 400 when request body is empty', async () => {
        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
      });

      it('should return 400 when subscriptionPrice is missing', async () => {
        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cardDetails: createValidCardDetails(),
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'subscriptionPrice',
            }),
          ]),
        );
      });

      it('should return 400 when subscriptionPrice is not a number', async () => {
        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 'not-a-number',
            cardDetails: createValidCardDetails(),
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'subscriptionPrice',
              message: expect.stringContaining('number'),
            }),
          ]),
        );
      });

      it('should return 400 when subscriptionPrice is less than minimum', async () => {
        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 0,
            cardDetails: createValidCardDetails(),
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'subscriptionPrice',
            }),
          ]),
        );
      });

      it('should return 400 when cardDetails is missing', async () => {
        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails',
            }),
          ]),
        );
      });
    });

    describe('Card Number Validation', () => {
      it('should return 400 when card number is missing', async () => {
        const cardDetails = createValidCardDetails();
        const { cardNumber, ...cardWithoutNumber } = cardDetails;

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails: cardWithoutNumber,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails.cardNumber',
            }),
          ]),
        );
      });

      it('should return 400 when card number is not 16 digits', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.cardNumber = '411111111111'; // Only 12 digits

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails.cardNumber',
              message: expect.stringContaining('16 digits'),
            }),
          ]),
        );
      });

      it('should return 400 when card number contains non-numeric characters', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.cardNumber = '4111-1111-1111-1111';

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('Expiry Month Validation', () => {
      it('should return 400 when expiry month is missing', async () => {
        const cardDetails = createValidCardDetails();
        const { expiryMonth, ...cardWithoutMonth } = cardDetails;

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails: cardWithoutMonth,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails.expiryMonth',
            }),
          ]),
        );
      });

      it('should return 400 when expiry month is invalid (00)', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.expiryMonth = '00';

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should return 400 when expiry month is invalid (13)', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.expiryMonth = '13';

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should accept valid expiry months (01-12)', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.expiryMonth = '06';

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('Expiry Year Validation', () => {
      it('should return 400 when expiry year is missing', async () => {
        const cardDetails = createValidCardDetails();
        const { expiryYear, ...cardWithoutYear } = cardDetails;

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails: cardWithoutYear,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails.expiryYear',
            }),
          ]),
        );
      });

      it('should return 400 when expiry year is not 2 digits', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.expiryYear = '2025'; // 4 digits instead of 2

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should return 400 when card has expired', async () => {
        const cardDetails = createValidCardDetails();
        // Use a past year
        cardDetails.expiryYear = '20';
        cardDetails.expiryMonth = '01';

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('expired'),
            }),
          ]),
        );
      });
    });

    describe('Already Premium User', () => {
      it('should return 400 when user already has premium subscription', async () => {
        // Create existing premium subscription for the user
        await Subscription.create({
          user_id: new mongoose.Types.ObjectId(userId),
          plan: SubscriptionPlan.PREMIUM,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          auto_renew: true,
        });

        // Also update user subscription status
        await User.findByIdAndUpdate(userId, {
          subscription_status: SubscriptionStatus.PREMIUM,
        });

        const paymentRequest = createValidPaymentRequest();

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentRequest);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Already subscribed to premium');
      });
    });

    describe('CVV Validation', () => {
      it('should return 400 when CVV is missing', async () => {
        const cardDetails = createValidCardDetails();
        const { cvv, ...cardWithoutCvv } = cardDetails;

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails: cardWithoutCvv,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails.cvv',
            }),
          ]),
        );
      });

      it('should return 400 when CVV is not 3 digits', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.cvv = '12'; // Only 2 digits

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cardDetails.cvv',
              message: expect.stringContaining('3 digits'),
            }),
          ]),
        );
      });

      it('should return 400 when CVV contains non-numeric characters', async () => {
        const cardDetails = createValidCardDetails();
        cardDetails.cvv = '12a';

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            subscriptionPrice: 9.99,
            cardDetails,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/payment (Payment History)', () => {
      it('should return empty payment history for user with no payments', async () => {
        const res = await request(app)
          .get(PAYMENT_BASE)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.payments).toEqual([]);
      });

      it('should return payment history after successful payment', async () => {
        // First make a payment
        const paymentRequest = createValidPaymentRequest(14.99);
        await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentRequest);

        // Then get payment history
        const res = await request(app)
          .get(PAYMENT_BASE)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.payments).toHaveLength(1);
        expect(res.body.data.payments[0].amount).toBe(14.99);
        expect(res.body.data.payments[0].status).toBe(PaymentStatus.COMPLETED);
        expect(res.body.data.payments[0].cardLast4).toBe('1111');
      });

      it('should return 401 when no authorization header is provided', async () => {
        const res = await request(app).get(PAYMENT_BASE);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return payments sorted by timestamp descending with most recent first', async () => {
        // Create multiple payments with different timestamps directly in database
        const baseTimestamp = Date.now();

        const payment1 = await Payment.create({
          user_id: new mongoose.Types.ObjectId(userId),
          amount: 9.99,
          status: PaymentStatus.COMPLETED,
          card_last4: '1111',
          idempotency_key: `sort-test-1-${baseTimestamp}`,
          timestamp: new Date(baseTimestamp - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        });

        const payment2 = await Payment.create({
          user_id: new mongoose.Types.ObjectId(userId),
          amount: 14.99,
          status: PaymentStatus.COMPLETED,
          card_last4: '2222',
          idempotency_key: `sort-test-2-${baseTimestamp}`,
          timestamp: new Date(baseTimestamp), // Now (most recent)
        });

        const payment3 = await Payment.create({
          user_id: new mongoose.Types.ObjectId(userId),
          amount: 19.99,
          status: PaymentStatus.COMPLETED,
          card_last4: '3333',
          idempotency_key: `sort-test-3-${baseTimestamp}`,
          timestamp: new Date(baseTimestamp - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        });

        // Get payment history
        const res = await request(app)
          .get(PAYMENT_BASE)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.payments).toHaveLength(3);

        // Verify sorting: most recent first (payment2 -> payment3 -> payment1)
        const payments = res.body.data.payments;

        // Most recent payment should be first
        expect(payments[0].amount).toBe(14.99);
        expect(payments[0].cardLast4).toBe('2222');

        // Second most recent
        expect(payments[1].amount).toBe(19.99);
        expect(payments[1].cardLast4).toBe('3333');

        // Oldest payment should be last
        expect(payments[2].amount).toBe(9.99);
        expect(payments[2].cardLast4).toBe('1111');

        // Verify timestamps are in descending order
        const timestamps = payments.map((p: { timestamp: string }) => new Date(p.timestamp).getTime());
        for (let i = 0; i < timestamps.length - 1; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
        }
      });
    });

    describe('Idempotency', () => {
      it('should return same result for duplicate requests with same idempotency key', async () => {
        const paymentRequest = createValidPaymentRequest();
        const idempotencyKey = `test-idempotency-${Date.now()}`;

        // First request
        const res1 = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Idempotency-Key', idempotencyKey)
          .send(paymentRequest);

        expect(res1.status).toBe(200);
        expect(res1.body.success).toBe(true);

        const firstPaymentId = res1.body.data.paymentId;

        // Clean subscription for second test but keep payment
        await Subscription.deleteMany({});

        // Second request with same idempotency key (should return cached result)
        const res2 = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Idempotency-Key', idempotencyKey)
          .send(paymentRequest);

        expect(res2.status).toBe(200);
        expect(res2.body.success).toBe(true);

        // Should return the same payment ID from cache
        expect(res2.body.data.paymentId).toBe(firstPaymentId);
      });

      it('should process requests independently with different idempotency keys', async () => {
        const paymentRequest = createValidPaymentRequest();
        const idempotencyKey1 = `test-idempotency-uuid-111-${Date.now()}`;
        const idempotencyKey2 = `test-idempotency-uuid-222-${Date.now()}`;

        // First request with first idempotency key
        const res1 = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Idempotency-Key', idempotencyKey1)
          .send(paymentRequest);

        expect(res1.status).toBe(200);
        expect(res1.body.success).toBe(true);
        const firstPaymentId = res1.body.data.paymentId;

        // Clean subscription to allow another payment
        await Subscription.deleteMany({});
        await User.findByIdAndUpdate(userId, {
          subscription_status: SubscriptionStatus.FREE,
        });

        // Second request with different idempotency key
        const res2 = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Idempotency-Key', idempotencyKey2)
          .send(paymentRequest);

        expect(res2.status).toBe(200);
        expect(res2.body.success).toBe(true);
        const secondPaymentId = res2.body.data.paymentId;

        // Different idempotency keys should create separate payments
        expect(secondPaymentId).not.toBe(firstPaymentId);

        // Verify two separate payments exist in database
        const payments = await Payment.find({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        expect(payments.length).toBeGreaterThanOrEqual(2);
      });

      it('should process request normally without idempotency key header', async () => {
        const paymentRequest = createValidPaymentRequest();

        // Request without Idempotency-Key header
        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentRequest);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.paymentId).toBeDefined();
        expect(res.body.data.message).toBe('Payment successful');

        // Verify payment was created
        const payment = await Payment.findById(res.body.data.paymentId);
        expect(payment).not.toBeNull();
        expect(payment?.status).toBe(PaymentStatus.COMPLETED);
      });

      it('should handle rapid double-click simulation with same idempotency key', async () => {
        const paymentRequest = createValidPaymentRequest();
        const idempotencyKey = `test-rapid-click-${Date.now()}`;

        // Simulate rapid double-click by sending two requests nearly simultaneously
        const [res1, res2] = await Promise.all([
          request(app)
            .post(`${PAYMENT_BASE}/card`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Idempotency-Key', idempotencyKey)
            .send(paymentRequest),
          // Small delay to ensure second request arrives during first processing
          new Promise<request.Response>(resolve => {
            setTimeout(async () => {
              const response = await request(app)
                .post(`${PAYMENT_BASE}/card`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('Idempotency-Key', idempotencyKey)
                .send(paymentRequest);
              resolve(response);
            }, 50);
          }),
        ]);

        // Both should succeed
        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        expect(res1.body.success).toBe(true);
        expect(res2.body.success).toBe(true);

        // Both should return the same payment ID (cached result)
        expect(res1.body.data.paymentId).toBe(res2.body.data.paymentId);

        // Verify only 1 payment exists in database for this idempotency key
        const payments = await Payment.find({
          idempotency_key: idempotencyKey,
        });
        expect(payments).toHaveLength(1);
      });
    });

    describe('Transaction Atomicity', () => {
      it('should commit payment and subscription together on success', async () => {
        const paymentRequest = createValidPaymentRequest();

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentRequest);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify payment record status is completed
        const payment = await Payment.findById(res.body.data.paymentId);
        expect(payment).not.toBeNull();
        expect(payment?.status).toBe(PaymentStatus.COMPLETED);

        // Verify subscription plan is premium
        const subscription = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        expect(subscription).not.toBeNull();
        expect(subscription?.plan).toBe(SubscriptionPlan.PREMIUM);

        // Both changes committed together
        expect(payment?.updated_at).toBeDefined();
        expect(subscription?.updated_at).toBeDefined();
      });

      it('should not create orphaned payment records on validation failure', async () => {
        // Count payments before request
        const paymentsBefore = await Payment.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
        });

        // Invalid card details that will fail validation
        const invalidRequest = {
          subscriptionPrice: 9.99,
          cardDetails: {
            cardNumber: '1234', // Invalid - not 16 digits
            expiryMonth: '12',
            expiryYear: '99',
            cvv: '123',
          },
        };

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidRequest);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);

        // Verify no payment record was created
        const paymentsAfter = await Payment.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        expect(paymentsAfter).toBe(paymentsBefore);

        // Verify subscription unchanged (still free or null)
        const subscription = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        if (subscription) {
          expect(subscription.plan).toBe(SubscriptionPlan.FREE);
        }
      });

      it('should keep subscription unchanged when card charge fails due to expired card', async () => {
        // Get initial subscription state
        const subscriptionBefore = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });

        const paymentsBefore = await Payment.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
        });

        // Expired card that should fail
        const expiredCardRequest = {
          subscriptionPrice: 9.99,
          cardDetails: {
            cardNumber: '4111111111111111',
            expiryMonth: '01',
            expiryYear: '20', // Past year - expired
            cvv: '123',
          },
        };

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(expiredCardRequest);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);

        // Verify no new payment record created
        const paymentsAfter = await Payment.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        expect(paymentsAfter).toBe(paymentsBefore);

        // Verify subscription unchanged
        const subscriptionAfter = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        if (subscriptionBefore) {
          expect(subscriptionAfter?.plan).toBe(subscriptionBefore.plan);
        } else {
          // If no subscription before, should still be none or free
          if (subscriptionAfter) {
            expect(subscriptionAfter.plan).toBe(SubscriptionPlan.FREE);
          }
        }
      });

      it('should leave database in clean state after failed transaction', async () => {
        // Get initial state
        const initialPaymentCount = await Payment.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        const initialSubscription = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        const initialUser = await User.findById(userId);

        // Request that will fail validation
        const invalidRequest = {
          subscriptionPrice: -1, // Invalid negative price
          cardDetails: createValidCardDetails(),
        };

        const res = await request(app)
          .post(`${PAYMENT_BASE}/card`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidRequest);

        expect(res.status).toBe(400);

        // Verify database returns to pre-transaction state
        const finalPaymentCount = await Payment.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        expect(finalPaymentCount).toBe(initialPaymentCount);

        // Verify no orphaned subscription records
        const finalSubscription = await Subscription.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        if (initialSubscription) {
          expect(finalSubscription?._id.toString()).toBe(initialSubscription._id.toString());
          expect(finalSubscription?.plan).toBe(initialSubscription.plan);
        } else {
          // Should still be null or unchanged
          if (finalSubscription) {
            expect(finalSubscription.plan).toBe(SubscriptionPlan.FREE);
          }
        }

        // Verify user subscription status unchanged
        const finalUser = await User.findById(userId);
        expect(finalUser?.subscription_status).toBe(initialUser?.subscription_status);
      });
    });
  });

  // ==========================================================================
  // Subscription Service Integration Tests
  // ==========================================================================

  describe('Subscription Service Integration', () => {
    it('should verify subscription is upgraded to premium after payment', async () => {
      // Initially, user should have no subscription
      let subscription = await Subscription.findOne({
        user_id: new mongoose.Types.ObjectId(userId),
      });
      expect(subscription).toBeNull();

      // Make payment
      const paymentRequest = createValidPaymentRequest();
      await request(app)
        .post(`${PAYMENT_BASE}/card`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentRequest);

      // Verify subscription is now premium
      subscription = await Subscription.findOne({
        user_id: new mongoose.Types.ObjectId(userId),
      });

      expect(subscription).not.toBeNull();
      expect(subscription?.plan).toBe(SubscriptionPlan.PREMIUM);
      expect(subscription?.auto_renew).toBe(true);
      expect(subscription?.end_date).not.toBeNull();

      // Verify end_date is approximately 1 month from now
      const now = new Date();
      const endDate = new Date(subscription!.end_date!);
      const daysDifference = Math.round(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Should be approximately 30 days (allow some variance for month differences)
      expect(daysDifference).toBeGreaterThanOrEqual(28);
      expect(daysDifference).toBeLessThanOrEqual(31);
    });

    it('should update user subscription_status to premium after payment', async () => {
      // Make payment
      const paymentRequest = createValidPaymentRequest();
      await request(app)
        .post(`${PAYMENT_BASE}/card`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentRequest);

      // Verify user's subscription_status is updated
      const user = await User.findById(userId);
      expect(user?.subscription_status).toBe(SubscriptionStatus.PREMIUM);
    });
  });

  // ==========================================================================
  // Payment Service Integration Tests
  // ==========================================================================

  describe('Payment Service Integration', () => {
    it('should create payment record with correct data', async () => {
      const paymentRequest = createValidPaymentRequest(19.99);

      const res = await request(app)
        .post(`${PAYMENT_BASE}/card`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentRequest);

      expect(res.status).toBe(200);

      const paymentId = res.body.data.paymentId;
      const payment = await Payment.findById(paymentId);

      expect(payment).not.toBeNull();
      expect(payment?.user_id.toString()).toBe(userId);
      expect(payment?.amount).toBe(19.99);
      expect(payment?.status).toBe(PaymentStatus.COMPLETED);
      expect(payment?.card_last4).toBe('1111');
      expect(payment?.timestamp).toBeDefined();
    });

    it('should store only last 4 digits of card number', async () => {
      const paymentRequest = createValidPaymentRequest();
      paymentRequest.cardDetails.cardNumber = '5555555555554444';

      const res = await request(app)
        .post(`${PAYMENT_BASE}/card`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentRequest);

      expect(res.status).toBe(200);

      const payment = await Payment.findById(res.body.data.paymentId);
      expect(payment?.card_last4).toBe('4444');
    });
  });
});
