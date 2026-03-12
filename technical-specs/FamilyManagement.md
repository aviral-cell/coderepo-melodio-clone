# Melodio: Family Member Management & Account Switching

## Overview

Melodio is a music streaming platform that supports family accounts. Primary account holders can add family members, who get their own profiles linked to the primary account. Family members can switch between accounts seamlessly using a single authentication token swap.

Your task is to fix the family member management and account switching features. The infrastructure is in place — routes, controllers, and services exist — but family members are created as inactive, the account switching endpoint has no authorization checks, and the auth middleware doesn't verify active status.

## API Contract

### POST /api/family

**Purpose:** Add a new family member linked to the authenticated user's account

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "Jamie Morgan",
  "email": "jamie@melodio.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "member-id",
    "email": "jamie@melodio.com",
    "displayName": "Jamie Morgan",
    "username": "jamie-melodio-com",
    "accountType": "family_member",
    "primaryAccountId": "primary-user-id",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Family Member Rules:**
- The member's `isActive` field must be `true` so they can be used immediately.
- The member's `accountType` is set to `"family_member"`.
- The member's `primaryAccountId` is set to the creating user's ID.
- Both free and premium users can add family members.

**Error Responses:**
- 400 - Missing name or email
- 401 - Unauthorized
- 409 - Email already in use

---

### GET /api/family

**Purpose:** Get all active family members for the authenticated user

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "familyMembers": [
      {
        "_id": "member-id",
        "email": "jamie@melodio.com",
        "displayName": "Jamie Morgan",
        "accountType": "family_member",
        "primaryAccountId": "primary-user-id",
        "isActive": true
      }
    ],
    "maxMembers": 5,
    "remainingSlots": 4
  }
}
```

**Error Responses:**
- 401 - Unauthorized

---

### DELETE /api/family/:memberId

**Purpose:** Remove a family member

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Family member removed successfully"
  }
}
```

**Error Responses:**
- 401 - Unauthorized
- 403 - Not authorized to remove this member
- 404 - Family member not found

---

### POST /api/auth/switch

**Purpose:** Switch to a different account (family member or back to primary)

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "targetUserId": "target-user-id"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "user": {
      "_id": "target-user-id",
      "email": "jamie@melodio.com",
      "displayName": "Jamie Morgan",
      "accountType": "family_member",
      "primaryAccountId": "primary-user-id"
    }
  }
}
```

**Authorization Rules:**
- A **primary** user can switch to any of their own family members (target must have `primaryAccountId` equal to the current user's ID).
- A **family member** can only switch back to their own primary account (target must be the user referenced by their `primaryAccountId`).
- A family member **cannot** switch to another family member (even a sibling under the same primary).
- Switching to an unrelated account is forbidden.
- The target account must be active (`isActive: true`).

**Error Responses:**
- 401 - Unauthorized
- 403 - Not authorized to switch to this account
- 404 - Target user not found

## Additional Information

- Family members are stored as `User` documents with `account_type: "family_member"` and a `primary_account_id` reference — there is no separate Family model.
- The `getFamilyMembers` method already filters by `{ is_active: true }`, so creating members with `is_active: false` makes them invisible in the list.
- If a user's account is deactivated, any API request with their token should be rejected with a 401 error indicating the account is inactive.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
