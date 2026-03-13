# Melodio: Subscription & Card Payment

## Overview

Melodio is a music streaming app with a premium subscription model. Users can upgrade from a free to premium plan by paying with a credit or debit card. Premium unlocks adding unlimited playlists.

At the moment, the card payment functionality is completely broken and the subscription never actually upgrades.

## API Contract

### POST /api/payment/card

**Purpose:** Process a card payment to upgrade the user's subscription to premium

**Auth:** Required (Bearer token)

**Request Headers:**
- `Idempotency-Key`: A unique key to prevent duplicate payment processing

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

**Validation Rules:**
- Price must be a positive number
- Card details must be a valid format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-id",
    "subscription": {
      "plan": "premium",
      "startDate": "2024-01-15T10:00:00.000Z",
      "endDate": "2024-02-15T10:00:00.000Z"
    }
  },
  "message": "Payment processed successfully"
}
```

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

- 400 - "Validation failed" (invalid card details, expired card)


**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

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
        "paymentId": "payment-id",
        "amount": 9.99,
        "status": "completed",
        "idempotencyKey": "unique-key",
        "subscription": {
          "plan": "premium",
          "startDate": "2024-01-15T10:00:00.000Z",
          "endDate": "2024-02-14T10:00:00.000Z"
        },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/subscription

**Purpose:** Get the authenticated user's current subscription status

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "plan": "premium",
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": "2024-02-15T10:00:00.000Z",
    "autoRenew": true,
    "isFamilyMember": false,
    "primaryAccountId": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
