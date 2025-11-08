# Backend Data Fetching Fix Required - Admin Dashboard

## Issue Summary
The Fixmo Admin Dashboard is currently receiving incomplete data from several endpoints. Additionally, critical functionality like dismissing violations is missing from the backend. User and provider details are not being populated in nested objects, causing the frontend to display only IDs instead of names and other important information.

---

## ⚠️ MISSING ENDPOINT - MUST CREATE

### **Dismiss/Reverse Violation Endpoint** - `POST /api/penalty/admin/reverse-violation/:violationId`
**Status:** **DOES NOT EXIST** - Frontend is calling this endpoint but it's not implemented.

**Purpose:** Allow admins to dismiss a violation and restore the deducted penalty points to the user/provider.

#### Required Request:
```http
POST /api/penalty/admin/reverse-violation/123
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Evidence shows user/provider was not at fault"
}
```

#### Required Response:
```json
{
  "success": true,
  "message": "Violation dismissed and 15 points restored successfully"
}
```

#### Implementation Requirements:
1. Verify admin authentication and authorization
2. Fetch the violation record by `violation_id`
3. Verify the violation status is `active` (cannot dismiss already reversed violations)
4. Update violation status to `reversed`
5. Get the `penalty_points_deducted` from the violation
6. Restore points to the user/provider:
   - If `user_id` exists: Add points back to user's penalty_points
   - If `provider_id` exists: Add points back to provider's penalty_points
7. Create an adjustment log entry:
   - `adjustment_type`: 'restore'
   - `points_adjusted`: +{penalty_points_deducted}
   - `reason`: {provided reason}
   - `adjusted_by_admin_id`: {current admin's ID}
8. Return success response

#### Example Implementation:
```typescript
// POST /api/penalty/admin/reverse-violation/:violationId
async dismissViolation(req, res) {
  const { violationId } = req.params;
  const { reason } = req.body;
  const adminId = req.admin.admin_id; // From auth middleware

  // Validate reason
  if (!reason || reason.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Reason must be at least 10 characters'
    });
  }

  try {
    // Get violation
    const violation = await prisma.penaltyViolation.findUnique({
      where: { violation_id: violationId },
      include: { violation_type: true }
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    if (violation.status === 'reversed') {
      return res.status(400).json({
        success: false,
        message: 'Violation already dismissed'
      });
    }

    // Update violation status
    await prisma.penaltyViolation.update({
      where: { violation_id: violationId },
      data: { status: 'reversed' }
    });

    const pointsToRestore = violation.penalty_points_deducted;

    // Restore points to user or provider
    if (violation.user_id) {
      const user = await prisma.user.findUnique({
        where: { user_id: violation.user_id }
      });

      await prisma.user.update({
        where: { user_id: violation.user_id },
        data: { 
          penalty_points: user.penalty_points + pointsToRestore 
        }
      });

      // Create adjustment log
      await prisma.penaltyAdjustmentLog.create({
        data: {
          user_id: violation.user_id,
          adjustment_type: 'restore',
          points_adjusted: pointsToRestore,
          previous_points: user.penalty_points,
          new_points: user.penalty_points + pointsToRestore,
          reason: reason,
          adjusted_by_admin_id: adminId
        }
      });
    } else if (violation.provider_id) {
      const provider = await prisma.provider.findUnique({
        where: { provider_id: violation.provider_id }
      });

      await prisma.provider.update({
        where: { provider_id: violation.provider_id },
        data: { 
          penalty_points: provider.penalty_points + pointsToRestore 
        }
      });

      // Create adjustment log
      await prisma.penaltyAdjustmentLog.create({
        data: {
          provider_id: violation.provider_id,
          adjustment_type: 'restore',
          points_adjusted: pointsToRestore,
          previous_points: provider.penalty_points,
          new_points: provider.penalty_points + pointsToRestore,
          reason: reason,
          adjusted_by_admin_id: adminId
        }
      });
    }

    return res.json({
      success: true,
      message: `Violation dismissed and ${pointsToRestore} points restored successfully`
    });
  } catch (error) {
    console.error('Error dismissing violation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dismiss violation'
    });
  }
}
```

---

## Critical Issues to Fix

### 1. **Penalty Violations Endpoint** - `/api/penalty/admin/violations`
**Current Issue:** Returning only `user_id` and `provider_id` without nested user/provider objects.

**Required Fix:** Add Prisma `include` statements to populate related data.

#### Expected Response Structure:
```json
{
  "success": true,
  "data": {
    "violations": [
      {
        "violation_id": 123,
        "user_id": 45,
        "provider_id": null,
        "violation_code": "NO_SHOW",
        "penalty_points_deducted": 15,
        "status": "active",
        "created_at": "2025-11-06T10:30:00Z",
        "appeal_reason": null,
        "appeal_status": null,
        
        // ⚠️ MISSING: User nested object
        "user": {
          "user_id": 45,
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@example.com"
        },
        
        // ⚠️ MISSING: Provider nested object (when provider_id exists)
        "provider": null,
        
        // ⚠️ MISSING: Violation type details
        "violation_type": {
          "violation_code": "NO_SHOW",
          "violation_name": "Customer No-Show",
          "penalty_points": 15
        }
      }
    ]
  }
}
```

#### Prisma Query Example:
```typescript
const violations = await prisma.penaltyViolation.findMany({
  where: { /* filters */ },
  include: {
    user: {
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    },
    provider: {
      select: {
        provider_id: true,
        provider_first_name: true,
        provider_last_name: true,
        provider_email: true
      }
    },
    violation_type: {
      select: {
        violation_code: true,
        violation_name: true,
        penalty_points: true
      }
    }
  },
  orderBy: { created_at: 'desc' }
});
```

---

### 2. **Penalty Adjustment Logs Endpoint** - `/api/penalty/admin/adjustment-logs`
**Current Issue:** `adjusted_by_admin` is returning null or only `adjusted_by_admin_id` without admin details.

**Required Fix:** Include admin details in the response.

#### Expected Response Structure:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "adjustment_id": 789,
        "user_id": 45,
        "provider_id": null,
        "adjustment_type": "penalty",
        "points_adjusted": -15,
        "previous_points": 100,
        "new_points": 85,
        "reason": "Dismissed - Evidence shows user was not at fault",
        "created_at": "2025-11-06T10:30:00Z",
        
        // ⚠️ MISSING: Admin details
        "adjusted_by_admin": {
          "admin_id": 1,
          "admin_name": "Super Admin",  // or "name" field
          "admin_email": "admin@fixmo.com"  // or "email" field
        }
      }
    ]
  }
}
```

#### Prisma Query Example:
```typescript
const logs = await prisma.penaltyAdjustmentLog.findMany({
  where: { /* filters */ },
  include: {
    adjusted_by_admin: {
      select: {
        admin_id: true,
        admin_name: true,  // or name: true
        admin_email: true  // or email: true
      }
    }
  },
  orderBy: { created_at: 'desc' }
});
```

**Note:** There's a schema inconsistency. The Admin model might be using:
- `first_name` & `last_name` (standard) OR
- `admin_name` (single field) OR
- `name` (single field)

Please confirm which fields exist and adjust the frontend interface accordingly.

---

### 3. **Pending Appeals Endpoint** - `/api/penalty/admin/appeals/pending`
**Current Issue:** Same as violations - missing user/provider nested objects. **ALSO MISSING: Evidence/attachment images submitted with appeal.**

**Required Fix:** Apply the same `include` pattern as violations endpoint + include appeal evidence URLs.

#### Expected Response Structure:
```json
{
  "success": true,
  "data": {
    "appeals": [
      {
        "violation_id": 123,
        "user_id": 45,
        "provider_id": null,
        "violation_name": "Customer No-Show",
        "violation_code": "NO_SHOW",
        "penalty_points_deducted": 15,
        "appeal_reason": "My car broke down on the way, I have proof",
        "appeal_status": "pending",
        "created_at": "2025-11-06T08:00:00Z",
        
        // ⚠️ MISSING: Evidence images/files
        "appeal_evidence": [
          "https://storage.example.com/evidence/abc123.jpg",
          "https://storage.example.com/evidence/def456.jpg"
        ],
        // Alternative field names: "evidence", "attachments", "files"
        
        // ⚠️ MISSING: User/Provider details
        "user": {
          "user_id": 45,
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@example.com"
        },
        "provider": null,
        "violation_type": { /* ... */ }
      }
    ]
  }
}
```

**Important:** Evidence can be:
- Single URL string: `"appeal_evidence": "https://..."`
- Array of URLs: `"appeal_evidence": ["https://...", "https://..."]`
- Alternative field names: `evidence`, `attachments`, `files`

Frontend will handle all formats automatically.

---

### 4. **Restricted Accounts Endpoint** - `/api/penalty/admin/restricted`
**Current Issue:** User/Provider data might be incomplete.

**Required Fix:** Ensure all user/provider fields are returned.

#### Expected Response Structure:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": 45,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "penalty_points": 55,
        "is_suspended": false,
        "suspension_reason": null,
        "suspension_ends_at": null
      }
    ],
    "providers": [
      {
        "provider_id": 78,
        "provider_first_name": "Jane",  // Note: provider_ prefix
        "provider_last_name": "Smith",
        "provider_email": "jane.smith@example.com",
        "penalty_points": 45,
        "is_suspended": false,
        "suspension_reason": null,
        "suspension_ends_at": null
      }
    ]
  }
}
```

---

## Additional Endpoints Affected

### 5. **Dashboard Stats** - `/api/penalty/admin/dashboard-stats`
Should include complete violation type information in `commonViolations`:

```json
{
  "totalViolations": 150,
  "weeklyViolations": 12,
  "suspendedUsers": 3,
  "suspendedProviders": 1,
  "restrictedUsers": 8,
  "restrictedProviders": 5,
  "pendingAppeals": 6,
  "commonViolations": [
    {
      "violation_code": "NO_SHOW",
      "violation_name": "Customer No-Show",
      "penalty_points": 15,
      "count": 45
    }
  ]
}
```

---

## Schema Verification Needed

### Admin Model Field Names
Please confirm which field structure is used in the Admin model:

**Option A (Standard):**
```prisma
model Admin {
  admin_id Int
  first_name String
  last_name String
  email String
}
```

**Option B (Single Name Field):**
```prisma
model Admin {
  admin_id Int
  name String  // or admin_name String
  email String // or admin_email String
}
```

Frontend is currently expecting both formats with fallbacks:
```typescript
adjusted_by_admin?: {
  admin_id: number;
  name?: string;
  admin_name?: string;  // Backend might use this
  email?: string;
  admin_email?: string; // Backend might use this
}
```

---

## Testing Checklist

After implementing fixes, verify:

### Endpoint Functionality:
- [ ] **NEW ENDPOINT**: `POST /api/penalty/admin/reverse-violation/:id` exists and works
- [ ] Dismissing a violation restores points correctly
- [ ] Violation status updates to 'reversed' after dismissal
- [ ] Adjustment log is created when violation is dismissed
- [ ] Cannot dismiss an already dismissed violation (proper error handling)

### Data Population:
- [ ] Violations table shows user/provider names (not just IDs)
- [ ] Violation details modal displays complete user/provider information
- [ ] Appeals show who submitted the appeal with their name
- [ ] **Appeals display evidence images/attachments submitted by users**
- [ ] Evidence images are clickable and open in new tab
- [ ] Evidence images load correctly (valid URLs)
- [ ] Adjustment logs show which admin made the change
- [ ] Restricted accounts show complete user/provider details
- [ ] Dashboard stats include violation type names
- [ ] All endpoints return data in the expected JSON structure

---

## Priority

**CRITICAL PRIORITY** - The dismiss violation endpoint is completely missing, blocking core admin functionality. The data fetching issues are HIGH PRIORITY as they prevent proper violation management, appeal reviews, and penalty adjustments.

---

## Frontend Dependencies

The frontend is ready to display all this data. The following components are waiting for complete data:

1. `src/app/dashboard/penalties/page.tsx` - Violations, Appeals, Logs, Restricted Accounts tabs
2. View Violation Details Modal - Shows complete violation information
3. Dismiss Violation Modal - Displays user/provider context
4. Appeal Review Modal - Shows appellant information
5. Adjustment Logs - Shows admin who made changes

---

## Contact

If you need clarification on any expected data structures or have questions about the Prisma relationships, please reach out before implementing.

**Note:** The frontend already has proper error handling and fallbacks for missing data, but the user experience is significantly degraded without the nested objects.
