# Melodio: Family Management

## Overview

Melodio is a music streaming platform that allows Premium users to create family member accounts. Family members share the primary account's Premium benefits without needing their own subscription. Users can seamlessly switch between their primary account and family member accounts to access personalized playlists and preferences.

Your task is to fix the family management system that allows Premium users to add up to 3 family members and switch between accounts. The system should properly activate new family members, validate account relationships before switching, and prevent inactive accounts from accessing protected endpoints.


## Expected API Behavior

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


### GET /api/family

**Purpose:** List all family members for the current user

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "familyMembers": [
      {
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
    ],
    "maxMembers": 3,
    "remainingSlots": 2
  }
}
```


### DELETE /api/family/:memberId

**Purpose:** Remove a family member (soft delete)

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Family member removed successfully"
}
```

**Error Responses:**
- 403 - Not authorized to remove this member
- 404 - Member not found


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


## Testing Requirements

The component includes specific data-testid attributes required for automated test execution. These identifiers must not be modified:

| data-testid | Description |
|-------------|-------------|
| `family-settings-page` | Main family settings page container |
| `add-family-member-btn` | Button to open add member form |
| `add-member-form` | Form for adding new family member |
| `member-email-input` | Input field for member email |
| `member-name-input` | Input field for member display name |
| `member-username-input` | Input field for member username |
| `submit-member-btn` | Button to submit new member |
| `family-member-list` | Container for list of family members |
| `family-member-card-{memberId}` | Individual family member card (replace `{memberId}` with actual ID) |
| `remove-member-btn-{memberId}` | Button to remove family member (replace `{memberId}` with actual ID) |
| `account-switcher` | Account switcher dropdown component |
| `switch-account-btn-{userId}` | Button to switch to specific account (replace `{userId}` with actual ID) |


## Additional Information

- Only Premium users can add family members. Maximum 3 family members per primary account.
- Family members should be created with `isActive: true` so they can be used immediately.
- Account switching rules: Primary can switch to their family members, family member can switch to their primary. No user can switch to an unrelated account.
- The auth middleware should check if the authenticated user's account is active (`is_active: true`) before allowing access to protected endpoints.
- Inactive accounts should receive 401 "Account inactive" error.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
