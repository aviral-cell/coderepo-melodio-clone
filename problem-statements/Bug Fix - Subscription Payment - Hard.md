# Bug Fix: Subscription Payment

`Hard`

## Overview

**Skills:** Node.js (Advanced)
**Recommended Duration:** 60 mins

This backend development question evaluates Node.js, payment processing, and subscription management concepts, ideal for senior-level roles. The problem requires identifying and fixing critical bugs in the card payment and subscription upgrade flow of a music streaming app.

Melodio is a music streaming app with a freemium subscription model. Users can upgrade from a free to premium plan by paying with a credit or debit card. Premium unlocks features like unlimited playlists and higher audio quality. Each subscription lasts 30 days from the payment date.

At the moment, the card payment functionality is completely broken. When users attempt to pay for a premium subscription, the payment crashes, validation is missing, the subscription never actually upgrades to premium, and duplicate payments are not prevented.

[SS]

## Issue Summary

When a user clicks "Pay," the payment process crashes because the server reads the wrong field from the request. Even if that is resolved, expired credit cards are accepted because the expiry date validation does nothing. After a successful payment, the subscription plan remains set to "free" instead of changing to "premium." The subscription end date is never advanced — it equals the start date instead of being 30 days later. The payment record stays in "Pending" status and is never updated to "Completed." The user's account-level subscription status is never changed, so the rest of the app still treats them as a free user. If the user clicks "Pay" again with the same request, a duplicate payment is processed instead of being prevented.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Navigate to the Subscription page from the sidebar.
- Click "Upgrade to Premium."
- Enter valid card details and click "Pay."
- Observe that the payment fails or produces incorrect results.
- If the initial failure is bypassed, observe the subscription plan is still "free" on the account.
- Try submitting the same payment again — observe that a duplicate charge occurs.
- Check the payment history — observe that the payment status shows "pending" instead of "completed."

## Expected Behavior

- Expired cards should be rejected with an appropriate error message.
- The payment amount should match the subscription price from the request.
- After successful payment, the subscription plan should change to "premium" with a 30-day duration.
- The payment record status should update to "Completed."
- The user's account-level subscription status should reflect "premium."
- Sending the same payment request twice (using the same idempotency key) should return the cached result instead of processing a duplicate payment.

**Note:** Make sure to review the `technical-specs/SubscriptionPayment.md` file carefully to understand all the specifications and expected behavior.
