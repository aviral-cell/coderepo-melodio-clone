**Feature: Subscription & Payment System - Hard**

Melodio is a music streaming app that offers two subscription tiers: Free and Premium. Free users are limited to 2 playlists, while Premium users enjoy unlimited playlists and can add up to 3 family members. The payment system allows users to upgrade to Premium by processing credit card payments securely.

Your task is to fix the payment processing flow. Currently, users cannot successfully upgrade to Premium - the payment system has multiple issues preventing proper subscription upgrades.


**Product Requirements**

* When a user submits valid card details with the correct subscription price, the payment should process successfully.
* The system should validate card expiry dates and reject cards that have already expired with a clear error message.
* To prevent double charges from accidental double-clicks, the system should use idempotency keys. If the same idempotency key is submitted twice, the second request should return the cached result without processing another payment.
* After successful payment, the user's subscription plan should be upgraded to Premium.
* After successful payment, the user's profile `subscription_status` field should be updated to reflect their new Premium status.
* After successful payment, the payment record's status should be updated from "pending" to "completed".


**Steps to Test Functionality**

* Log in using test credentials:
  * Email: alex.morgan@hackify.com
  * Password: password123
* Navigate to the Subscription page from the sidebar.
* Click on "Upgrade to Premium" button.
* Enter valid card details:
  * Card Number: 4111111111111111
  * Expiry Month: 12
  * Expiry Year: 28
  * CVV: 123
* Click "Submit Payment".
* Observe that the payment fails with "amount is required" error even though valid data was provided.
* Even if payment succeeds through direct API calls, the subscription plan remains "free" and the payment status stays "pending".


**Note:** Make sure to review the technical-specs/SubscriptionPayment.md file carefully to understand all the specifications and expected behavior.


**README**

## API Contract

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
- 400 - Validation error or already premium
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


**Additional Information:**

* Card validation rules:
  * Card number: exactly 16 digits
  * Expiry month: 01-12 (two digits)
  * Expiry year: two digits, must not be expired
  * CVV: exactly 3 digits
* The request body uses `subscriptionPrice` as the field name for the payment amount.
* Check how the payment controller accesses the price from the request body.
* Examine the `validateExpiryDate` function to ensure it actually validates against the current date.
* Look at what plan value is set in the `upgradeToPremium` function.
* Verify that both payment status and user subscription status are updated after successful charge.
* To manually reset the database, stop the running server and then restart it.
* The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
* If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
