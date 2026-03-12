# Feature: Family Member Account Switching

`Hard`

## Overview

**Skills:** Node.js (Advanced)
**Recommended Duration:** 60 mins

This backend development question evaluates Node.js, authorization, and account management concepts, ideal for senior-level roles. The task involves implementing family account switching with proper authorization controls in a music streaming app.

Melodio is a music streaming app that supports family accounts. Primary account holders can add family members, who get their own profiles and can be switched to seamlessly. This allows families to share a single subscription while maintaining separate listening preferences and history.

Currently, the family member infrastructure is in place, but the feature has critical issues: family members are created as inactive (making them unusable), the account switching has no authorization checks (allowing anyone to impersonate any user), and deactivated accounts can still access the API.

[SS]

## Product Requirements

- When a primary user adds a family member, the member should be created with active status so they can be used immediately.
- A primary user should be able to switch to any of their own family members' accounts.
- A family member should be able to switch back to their primary account only — not to other family members.
- Attempting to switch to an unrelated account (no family relationship) should return a 403 error.
- Attempting to switch from one family member to another family member (even under the same primary) should return a 403 error.
- If a user's account is deactivated (set to inactive), any subsequent API request with their token should be rejected with a 401 error indicating the account is inactive.
- Deactivation should take effect immediately — even if the user has a valid token from before deactivation.

## Steps to Test Functionality

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Navigate to Settings > Family and add a new family member with a name and email.
- Observe that the member is created successfully and appears in the family members list.
- Switch to the newly created family member account.
- Observe that a new token is issued and the UI reflects the family member's profile.
- From the family member account, switch back to the primary account — observe it succeeds.
- From the family member account, attempt to switch to another family member — observe a 403 error.

**Note:** Make sure to review the `technical-specs/FamilyManagement.md` file carefully to understand all the specifications and expected behavior.
