# Melodio: Subscription & Card Payment

## Overview

Melodio is a music streaming platform with a freemium subscription model. Free users have limited features (e.g., 7 playlist cap), while premium users unlock full access. Users can upgrade to premium by paying with a credit/debit card through the payment page.

Your task is to fix the card payment flow. The payment infrastructure exists — routes, controller, service, and models are all wired — but the payment flow has a cascade of bugs that prevent correct behavior.

## API Contract

### POST /api/payment/card

**Purpose:** Process a card payment to upgrade the user's subscription to premium

**Auth:** Required (Bearer token)

**Request Headers:**
- `Idempotency-Key` (optional): A unique key to prevent duplicate payment processing

**Request Body:**
```json
{
  "subscriptionPrice": 9.99,
  "cardDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "28",
    "cvv": "123",
    "cardholderName": "Alex Morgan"
  }
}
```

**Validation Rules:**
- `subscriptionPrice` (required): Must be a positive number (min 0.01)
- `cardDetails.cardNumber` (required): Must be a valid card number format
- `cardDetails.expiryMonth` (required): Two-digit month string ("01"-"12")
- `cardDetails.expiryYear` (required): Two-digit year string; the card must not be expired (compare against current month/year)
- `cardDetails.cvv` (required): 3 or 4 digit string
- `cardDetails.cardholderName` (required): Non-empty string

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "paymentId": "payment-id",
    "message": "Payment successful",
    "subscription": {
      "plan": "premium",
      "startDate": "2024-01-15T10:00:00.000Z",
      "endDate": "2024-02-14T10:00:00.000Z"
    }
  }
}
```

**Payment Flow:**
1. If an `Idempotency-Key` header is present, check the in-memory cache for a previously processed result with that key. If found, return the cached result immediately (200).
2. Validate the card details including expiry date.
3. Create a payment record with status `PENDING`.
4. Simulate card charge processing.
5. Upgrade the user's subscription to premium with a 30-day duration.
6. Update the user's `subscription_status` field to `"premium"`.
7. Update the payment record status to `COMPLETED`.
8. If an `Idempotency-Key` header is present, store the result in the cache.
9. Return the success response with payment ID and subscription details.

**Validation Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    {
      "field": "expiryYear",
      "message": "Card has expired"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Validation failed" (invalid card details, expired card)
- 400 - "Already subscribed to premium"
- 400 - "Card charge failed"
- 401 - "User not authenticated"
- 500 - "Failed to create payment record"

---

### GET /api/payment

**Purpose:** Get the authenticated user's payment history

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "payment-id",
        "userId": "user-id",
        "amount": 9.99,
        "status": "completed",
        "cardLast4": "1111",
        "idempotencyKey": "unique-key",
        "timestamp": "2024-01-15T10:00:00.000Z",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 401 - "User not authenticated"
- 404 - "User not found"

---

### GET /api/subscription

**Purpose:** Get the authenticated user's current subscription status

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "subscription-id",
    "userId": "user-id",
    "plan": "premium",
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": "2024-02-14T10:00:00.000Z",
    "autoRenew": false,
    "isFamilyMember": false,
    "primaryAccountId": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 401 - "User not authenticated"
- 404 - "User not found"

## Additional Information

- The frontend sends the payment amount as `subscriptionPrice` in the request body.
- The `chargeCard` function in the payment service simulates card processing and is already working.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
