# Melodio: Subscription & Payment

## Overview

Melodio is a music streaming platform that offers two subscription tiers: Free and Premium. Free users are limited to 2 playlists, while Premium users enjoy unlimited playlists and can add up to 3 family members. Users can upgrade to Premium by processing a credit card payment.

Your task is to fix the payment processing flow that allows users to upgrade from Free to Premium. The system should validate card details, process payments securely, prevent duplicate charges using idempotency keys, and update both the subscription and user records after successful payment.


## Expected API Behavior

### POST /api/payment/card

**Purpose:** Process card payment for premium subscription upgrade

**Auth:** Required (Bearer token)

**Headers:**
- `Idempotency-Key` (optional): Unique key to prevent duplicate charges

**Request Body:**
```json
{
  "subscriptionPrice": 9.99,
  "cardDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "28",
    "cvv": "123"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-id",
    "transactionId": "txn_card_1234567890_abc123",
    "message": "Payment successful",
    "subscription": {
      "plan": "premium",
      "startDate": "2024-01-15T10:00:00.000Z",
      "endDate": "2024-02-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- 400 - Validation error (invalid card, expired card, already premium)
- 401 - Unauthorized
- 500 - Server error


### GET /api/subscription

**Purpose:** Get current user's subscription status

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
    "endDate": "2024-02-15T10:00:00.000Z",
    "autoRenew": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```


### GET /api/payment

**Purpose:** Get user's payment history

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "payment-id",
      "userId": "user-id",
      "amount": 9.99,
      "status": "completed",
      "cardLast4": "1111",
      "idempotencyKey": "unique-key-123",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```


## Testing Requirements

The component includes specific data-testid attributes required for automated test execution. These identifiers must not be modified:

| data-testid | Description |
|-------------|-------------|
| `subscription-page` | Main subscription page container |
| `current-plan-badge` | Badge showing current subscription plan |
| `upgrade-premium-btn` | Button to initiate premium upgrade |
| `payment-modal` | Modal dialog for payment form |
| `card-number-input` | Input field for card number |
| `expiry-month-input` | Input field for expiry month |
| `expiry-year-input` | Input field for expiry year |
| `cvv-input` | Input field for CVV |
| `submit-payment-btn` | Button to submit payment |
| `payment-success-message` | Success message after payment |
| `payment-error-message` | Error message when payment fails |


## Additional Information

- Card validation rules: 16-digit card number, expiry month 01-12, expiry year 2 digits (not expired), CVV 3 digits.
- The request body uses `subscriptionPrice` as the field name for the payment amount.
- Expired cards should be rejected with a "Card has expired" error message.
- After successful payment: subscription plan should be "premium", user's `subscription_status` should be "premium", payment status should be "completed".
- Idempotency keys prevent double charges - same key should return cached response without reprocessing.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
