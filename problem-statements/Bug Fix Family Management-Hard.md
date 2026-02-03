**Feature: Family Management & Account Switching - Hard**

Melodio is a music streaming app that allows Premium users to create family member accounts. Family members share the primary account's Premium benefits without needing their own subscription. Users can seamlessly switch between their primary account and family member accounts to access personalized playlists and preferences.

Your task is to fix the family management system. Currently, family members cannot be used after creation, unauthorized users can switch to any account, and deactivated accounts can still access the system.


**Product Requirements**

* When a Premium user creates a family member, the new account should be immediately active and usable.
* Family members should be able to switch back to their primary account, and primary users should be able to switch to their family members.
* Account switching should only be allowed between related accounts - a user should not be able to switch to another user's account that they have no relationship with.
* When an account is deactivated (is_active: false), that user should not be able to access any protected API endpoints.
* The auth middleware should verify that the authenticated user's account is active before allowing access.


**Steps to Test Functionality**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Ensure you have Premium subscription (upgrade if needed).
* Navigate to Family Settings from the sidebar.
* Add a new family member:
  * Email: family1@test.com
  * Display Name: Family Member 1
  * Username: familymember1
* Observe that the family member is created but with `isActive: false` instead of `true`.
* Try to switch to the family member account using the Account Switcher.
* Observe that switching fails because the account is inactive.
* Additionally, test account switching security:
  * Using API tools, try to switch to a random user ID that you have no relationship with.
  * Observe that the switch succeeds when it should be rejected with "Not authorized".


**Note:** Make sure to review the technical-specs/FamilyManagement.md file carefully to understand all the specifications and expected behavior.


**README**

## API Contract

### POST /api/family

**Purpose:** Add a new family member account

**Auth:** Required (Bearer token, Premium users only)

**Request Body:**
```json
{
  "email": "family@example.com",
  "displayName": "Family Member",
  "username": "familymember"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "member-id",
    "email": "family@example.com",
    "displayName": "Family Member",
    "username": "familymember",
    "accountType": "family_member",
    "primaryAccountId": "primary-user-id",
    "isActive": true,
    "subscriptionStatus": "premium",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- 400 - Max 3 family members reached
- 403 - Premium subscription required
- 409 - Email already registered

### POST /api/auth/switch

**Purpose:** Switch to a different account (primary or family member)

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "targetUserId": "user-id-to-switch-to"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "user": {
      "_id": "user-id",
      "email": "user@example.com",
      "displayName": "User Name",
      "accountType": "family_member",
      "primaryAccountId": "primary-user-id"
    }
  }
}
```

**Error Responses:**
- 401 - Account inactive
- 403 - Not authorized to switch to this account
- 404 - Target user not found

### GET /api/family

**Purpose:** List all family members

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "familyMembers": [...],
    "maxMembers": 3,
    "remainingSlots": 2
  }
}
```


**Additional Information:**

* Family member creation rules:
  * Only Premium users can add family members
  * Maximum 3 family members per primary account
  * Family members inherit the primary's subscription status
* Account switching security rules:
  * Primary user can switch to their family members
  * Family member can switch to their primary account
  * No user can switch to an unrelated user's account
* Check the `is_active` value set when creating family members in `family.service.ts`.
* Look at the `switchAccount` function in `auth.service.ts` - it should validate the relationship between current and target users.
* Examine `auth.middleware.ts` to ensure it checks the user's `is_active` status before allowing access.
* To manually reset the database, stop the running server and then restart it.
* The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
* If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
