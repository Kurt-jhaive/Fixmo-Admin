# Admin Penalty Management Features

## Overview
Complete admin control panel for managing the penalty system, including viewing logs, manual adjustments, account restrictions, and rehabilitation.

---

## 👨‍💼 Admin Capabilities

### 1️⃣ **View All Penalty Logs**
Admins can view comprehensive penalty logs across the entire platform.

**Endpoint:** `GET /api/penalty/admin/violations`

**Query Parameters:**
- `userId` (optional) - Filter by specific user
- `providerId` (optional) - Filter by specific provider
- `status` (optional) - Filter by status: `active`, `appealed`, `reversed`, `expired`
- `limit` (default: 100) - Records per page
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "violations": [
      {
        "violation_id": 1,
        "user_id": 45,
        "violation_type": {
          "violation_code": "USER_NO_SHOW",
          "penalty_points": 15
        },
        "penalty_points_deducted": 15,
        "status": "active",
        "created_at": "2025-10-30T10:00:00Z"
      }
    ]
  }
}
```

---

### 2️⃣ **Add Points (Reward/Correct Unfair Penalty)**
Manually add penalty points to reward good behavior or correct an unfair penalty.

**Endpoint:** `POST /api/penalty/admin/adjust-points`

**Request Body:**
```json
{
  "userId": 45,  // or "providerId": 12
  "points": 20,
  "adjustmentType": "add",
  "reason": "Correction for false complaint - verified user was not at fault"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Points adjusted successfully",
  "data": {
    "previousPoints": 55,
    "newPoints": 75,
    "suspended": false
  }
}
```

**Use Cases:**
- ✅ Reward exceptional service
- ✅ Correct false reports
- ✅ Compensate for system errors
- ✅ Goodwill gestures

---

### 3️⃣ **Deduct Points (Custom Penalties)**
Apply custom penalties for verified misconduct not automatically detected.

**Endpoint:** `POST /api/penalty/admin/adjust-points`

**Request Body:**
```json
{
  "providerId": 23,
  "points": 25,
  "adjustmentType": "deduct",
  "reason": "Verified harassment via messages - customer complaint upheld after investigation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Points adjusted successfully",
  "data": {
    "previousPoints": 85,
    "newPoints": 60,
    "suspended": false
  }
}
```

**Use Cases:**
- ⚠️ Manual verification of misconduct
- ⚠️ Off-platform violations
- ⚠️ Severe harassment cases
- ⚠️ Fraud attempts

---

### 4️⃣ **Restrict Accounts (Below 60 Points)**
When points drop below 60, booking features are temporarily disabled.

**Automatic Restriction:**
- Users/providers with < 60 points cannot create new bookings
- Existing bookings remain valid
- All other features remain accessible

**Check Restricted Accounts:**

**Endpoint:** `GET /api/penalty/admin/restricted-accounts`

**Query Parameters:**
- `type` - `user`, `provider`, or `both` (default: both)
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "restrictedUsers": [
      {
        "user_id": 45,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "penalty_points": 55,
        "is_suspended": false
      }
    ],
    "restrictedProviders": []
  }
}
```

**Manual Suspension:**

**Endpoint:** `POST /api/penalty/admin/manage-suspension`

**Request Body (Suspend):**
```json
{
  "userId": 45,
  "action": "suspend",
  "reason": "Multiple verified violations - temporary suspension for 7 days",
  "suspensionDays": 7  // Optional: null = indefinite
}
```

**Request Body (Lift Suspension):**
```json
{
  "userId": 45,
  "action": "lift",
  "reason": "Appeal approved - violation reversed after review"
}
```

---

### 5️⃣ **Lift Restrictions After Appeal**
Review and approve appeals to restore points and lift restrictions.

**Endpoint:** `GET /api/penalty/admin/pending-appeals`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "violation_id": 123,
      "user": {
        "user_id": 45,
        "first_name": "John",
        "email": "john@example.com"
      },
      "violation_type": {
        "violation_code": "USER_NO_SHOW",
        "penalty_points": 15
      },
      "appeal_reason": "I was in hospital emergency, have medical records",
      "appeal_status": "pending",
      "created_at": "2025-10-29T14:00:00Z"
    }
  ]
}
```

**Review Appeal:**

**Endpoint:** `POST /api/penalty/admin/review-appeal/:violationId`

**Request Body (Approve):**
```json
{
  "approved": true,
  "reviewNotes": "Verified medical emergency - hospital records provided. Points restored."
}
```

**Request Body (Reject):**
```json
{
  "approved": false,
  "reviewNotes": "No evidence provided. Appeal does not meet criteria for reversal."
}
```

---

### 6️⃣ **Reset Points to Default 100 (Rehabilitation)**
Reset penalty points to 100 for rehabilitation or after long inactivity.

**Endpoint:** `POST /api/penalty/admin/reset-points`

**Request Body:**
```json
{
  "userId": 45,  // or "providerId": 12
  "reason": "Rehabilitation - user has completed 6 months of good standing with no violations",
  "resetValue": 100  // Optional: default is 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Points reset to 100 successfully",
  "data": {
    "previousPoints": 35,
    "newPoints": 100,
    "suspensionLifted": true
  }
}
```

**Use Cases:**
- ✅ Long-term good behavior rehabilitation
- ✅ Account recovery after extended clean period
- ✅ Fresh start after payment of fines
- ✅ Completion of dispute resolution

---

### 7️⃣ **View Adjustment Logs**
Track all manual adjustments made by admins for audit purposes.

**Endpoint:** `GET /api/penalty/admin/adjustment-logs`

**Query Parameters:**
- `userId` (optional)
- `providerId` (optional)
- `adjustmentType` (optional) - `penalty`, `reward`, `restore`, `reset`, `suspension`, `lift_suspension`
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "adjustment_id": 1,
        "user_id": 45,
        "adjustment_type": "reset",
        "points_adjusted": 65,
        "previous_points": 35,
        "new_points": 100,
        "reason": "Rehabilitation after 6 months clean record",
        "adjusted_by_admin": {
          "admin_id": 1,
          "first_name": "Admin",
          "email": "admin@fixmo.com"
        },
        "created_at": "2025-10-30T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 245,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 8️⃣ **Dashboard Statistics**
Real-time overview of penalty system metrics.

**Endpoint:** `GET /api/penalty/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalViolations": 1234,
    "weeklyViolations": 45,
    "suspendedUsers": 3,
    "suspendedProviders": 2,
    "restrictedUsers": 12,
    "restrictedProviders": 8,
    "pendingAppeals": 7,
    "commonViolations": [
      {
        "violation_type": {
          "violation_code": "USER_LATE_CANCEL",
          "violation_name": "Late Cancellation",
          "penalty_points": 10
        },
        "_count": 342
      }
    ]
  }
}
```

---

## 🔐 Point Thresholds

| Point Range | Status | Restrictions |
|------------|--------|--------------|
| 100 | Perfect | No restrictions |
| 80-99 | Good Standing | No restrictions |
| 60-79 | Warning | Minor warnings shown |
| **40-59** | **⚠️ RESTRICTED** | **Cannot create new bookings** |
| 20-39 | Critical | Cannot create bookings, severe warnings |
| 1-19 | Pre-Suspension | Cannot create bookings, final warning |
| **0** | **🚫 SUSPENDED** | **All features disabled** |

---

## 📋 Admin Workflows

### **Workflow 1: Handling False Complaints**
1. Review complaint details
2. Investigate evidence
3. If false: `POST /api/penalty/admin/adjust-points` with `"adjustmentType": "add"`
4. Restore deducted points to innocent party
5. Optionally penalize false reporter

### **Workflow 2: Manual Violation Recording**
1. Verify misconduct through investigation
2. `POST /api/penalty/admin/record-violation`
3. Select appropriate violation code
4. Provide evidence URLs and notes
5. System automatically deducts points

### **Workflow 3: Appeal Review Process**
1. `GET /api/penalty/admin/pending-appeals` - View all pending
2. Review appeal reason and evidence
3. Check original violation details
4. `POST /api/penalty/admin/review-appeal/:id`
   - Approve: Points restored automatically
   - Reject: Violation remains, user notified

### **Workflow 4: Account Rehabilitation**
1. Check user history: `GET /api/penalty/admin/stats?userId=X`
2. Verify clean record period (e.g., 6 months)
3. `POST /api/penalty/admin/reset-points`
4. Set `resetValue: 100` and provide reason
5. User receives notification of rehabilitation

### **Workflow 5: Temporary Suspension**
1. Identify severe violation pattern
2. `POST /api/penalty/admin/manage-suspension`
3. Set `action: "suspend"` and `suspensionDays: 7`
4. User cannot access booking features for duration
5. After period: `action: "lift"` to restore access

---

## 🎯 Best Practices

### ✅ DO's
- Always provide detailed reasons (min 10 characters)
- Log evidence URLs when available
- Review appeal evidence thoroughly
- Use temporary suspensions before permanent ones
- Reset points after verified rehabilitation period
- Monitor adjustment logs regularly
- Track patterns in common violations

### ❌ DON'Ts
- Don't adjust points without clear justification
- Don't ignore appeals for extended periods
- Don't permanently suspend without escalation
- Don't reset points too frequently
- Don't skip documentation in adjustment logs

---

## 📊 Reporting & Analytics

**Get Individual Stats:**
```
GET /api/penalty/admin/stats?userId=45
```

**View All Restricted Accounts:**
```
GET /api/penalty/admin/restricted-accounts?type=both
```

**Track Admin Actions:**
```
GET /api/penalty/admin/adjustment-logs?adjustmentType=reset
```

**Monitor System Health:**
```
GET /api/penalty/admin/dashboard
```

---

## 🔄 Integration with Booking System

To enforce the 60-point restriction on bookings, add the middleware:

```javascript
// In booking routes
import { checkBookingEligibility } from '../middleware/checkSuspension.js';

router.post('/book-service', 
  authMiddleware, 
  checkBookingEligibility,  // Add this middleware
  bookingController.createBooking
);
```

This middleware will automatically:
- ✅ Allow bookings for users/providers >= 60 points
- ❌ Block bookings for users/providers < 60 points
- ❌ Block all actions for suspended accounts (0 points)

---

## 🚀 Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| View All Violations | `/api/penalty/admin/violations` | GET |
| Add/Deduct Points | `/api/penalty/admin/adjust-points` | POST |
| Manage Suspension | `/api/penalty/admin/manage-suspension` | POST |
| Reset Points | `/api/penalty/admin/reset-points` | POST |
| View Appeals | `/api/penalty/admin/pending-appeals` | GET |
| Review Appeal | `/api/penalty/admin/review-appeal/:id` | POST |
| Adjustment Logs | `/api/penalty/admin/adjustment-logs` | GET |
| Restricted Accounts | `/api/penalty/admin/restricted-accounts` | GET |
| Dashboard Stats | `/api/penalty/admin/dashboard` | GET |
| Record Violation | `/api/penalty/admin/record-violation` | POST |

---

**Last Updated:** October 31, 2025  
**Version:** 2.0 (Enhanced Admin Features)
