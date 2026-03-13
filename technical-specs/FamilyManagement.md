# Melodio: Family Member Management & Account Switching

## Overview

Melodio is a music streaming app that supports family accounts. Primary account holders can add family members, who get their own profiles and can be switched to seamlessly.

Currently, the family management feature is not functional; family members, account switching, and access controls all need to be implemented correctly. Your task is to implement the family member management and account switching features in the backend so they work smoothly end-to-end.

## API Contract

### POST /api/family

**Purpose:** Add a new family member linked to the user's account

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
    "username": "jamiemorgan_a1b2c3",
    "accountType": "family_member",
    "primaryAccountId": "primary-user-id",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Family Member Rules:**
- A **primary** user can switch to any of their own family members.
- A **family member** can only switch back to their own primary account.
- A family member **cannot** switch to another family member.
- The target account must be active.

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Maximum 3 family members allowed"
- 401 - "Unauthorized"
- 403 - "Only primary account can manage family"
- 409 - "Email already registered"

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
        "username": "jamiemorgan_a1b2c3",
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
      "primaryAccountId": "primary-user-id or null",
      "subscriptionStatus": "free"
    }
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

- 400 - "Target user ID is required"
- 400 - "Invalid target user ID"
- 403 - "Account is inactive"
- 403 - "Not authorized to switch to this account"
- 404 - "Target user not found"

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
