# Verification System - Dual Attribute Update Specification

## Overview
When admins approve or reject user/provider verification requests, the system updates **TWO** attributes simultaneously to maintain data consistency.

---

## Customer Verification

### Approve Customer
**Endpoint:** `PUT /api/admin/users/:userId/verify`

**Backend Updates:**
```javascript
{
  is_verified: true,              // ✅ Boolean flag
  verification_status: "approved"  // ✅ Status text
}
```

**Frontend Call:**
```typescript
await adminApi.verifyUser(userId);
```

---

### Reject Customer
**Endpoint:** `PUT /api/admin/users/:userId/reject`

**Request Body:**
```json
{
  "reason": "ID photo is blurry"
}
```

**Backend Updates:**
```javascript
{
  is_verified: false,             // ✅ Boolean flag
  verification_status: "rejected", // ✅ Status text
  rejection_reason: "ID photo is blurry"
}
```

**Frontend Call:**
```typescript
await adminApi.rejectUser(userId, reason);
```

---

## Service Provider Verification

### Approve Provider
**Endpoint:** `PUT /api/admin/providers/:providerId/verify`

**Backend Updates:**
```javascript
{
  provider_isVerified: true,       // ✅ Boolean flag
  verification_status: "approved"   // ✅ Status text
}
```

**Frontend Call:**
```typescript
await adminApi.verifyProvider(providerId, true);
```

---

### Reject Provider
**Endpoint:** `PUT /api/admin/providers/:providerId/reject`

**Request Body:**
```json
{
  "reason": "Certificate images are not clear"
}
```

**Backend Updates:**
```javascript
{
  provider_isVerified: false,      // ✅ Boolean flag
  verification_status: "rejected",  // ✅ Status text
  rejection_reason: "Certificate images are not clear"
}
```

**Frontend Call:**
```typescript
await adminApi.rejectProvider(providerId, reason);
```

---

## Why Both Attributes?

### 1. `is_verified` / `provider_isVerified` (Boolean)
- **Purpose**: Quick access control and authorization checks
- **Usage**: 
  - `if (user.is_verified) { allowBooking() }`
  - `if (provider.provider_isVerified) { showServices() }`
- **Values**: `true` or `false`

### 2. `verification_status` (String)
- **Purpose**: Detailed status tracking and UI display
- **Usage**:
  - Show badges in admin dashboard
  - Display verification stage to users
  - Track verification history
- **Values**: `"pending"`, `"approved"`, `"rejected"`

---

## Database Schema

### User Table
```sql
is_verified: BOOLEAN DEFAULT false,
verification_status: VARCHAR(20) DEFAULT 'pending',
rejection_reason: TEXT NULL,
verification_reviewed_at: TIMESTAMP NULL
```

### ServiceProviderDetails Table
```sql
provider_isVerified: BOOLEAN DEFAULT false,
verification_status: VARCHAR(20) DEFAULT 'pending',
rejection_reason: TEXT NULL,
verification_reviewed_at: TIMESTAMP NULL
```

---

## Backend Implementation Checklist

### Customer Verification Endpoints

#### ✅ `PUT /api/admin/users/:userId/verify`
```javascript
// Backend should update:
await prisma.user.update({
  where: { user_id: userId },
  data: {
    is_verified: true,
    verification_status: 'approved',
    rejection_reason: null,
    verification_reviewed_at: new Date()
  }
});
```

#### ✅ `PUT /api/admin/users/:userId/reject`
```javascript
// Backend should update:
await prisma.user.update({
  where: { user_id: userId },
  data: {
    is_verified: false,
    verification_status: 'rejected',
    rejection_reason: req.body.reason,
    verification_reviewed_at: new Date()
  }
});
```

### Provider Verification Endpoints

#### ✅ `PUT /api/admin/providers/:providerId/verify`
```javascript
// Backend should update:
await prisma.serviceProviderDetails.update({
  where: { provider_id: providerId },
  data: {
    provider_isVerified: true,
    verification_status: 'approved',
    rejection_reason: null,
    verification_reviewed_at: new Date()
  }
});
```

#### ✅ `PUT /api/admin/providers/:providerId/reject`
```javascript
// Backend should update:
await prisma.serviceProviderDetails.update({
  where: { provider_id: providerId },
  data: {
    provider_isVerified: false,
    verification_status: 'rejected',
    rejection_reason: req.body.reason,
    verification_reviewed_at: new Date()
  }
});
```

---

## Frontend Implementation

### Current API Calls (Already Correct)

The Fixmo Admin frontend is already making the correct API calls:

**Users Page:**
```typescript
// Approve
await adminApi.verifyUser(userId);

// Reject
await adminApi.rejectUser(userId, rejectionReason);
```

**Service Providers Page:**
```typescript
// Approve
await adminApi.verifyProvider(providerId, true);

// Reject
await adminApi.rejectProvider(providerId, rejectionReason);
```

---

## Testing Checklist

### Test Approve Customer
1. ✅ Admin clicks "Verify" button
2. ✅ Backend receives `PUT /api/admin/users/:userId/verify`
3. ✅ Backend updates `is_verified = true`
4. ✅ Backend updates `verification_status = "approved"`
5. ✅ Backend clears `rejection_reason = null`
6. ✅ Backend sets `verification_reviewed_at = NOW()`
7. ✅ Email sent to customer
8. ✅ Frontend refreshes and shows "Verified" badge

### Test Reject Customer
1. ✅ Admin enters rejection reason
2. ✅ Admin clicks "Reject" button
3. ✅ Backend receives `PUT /api/admin/users/:userId/reject` with reason
4. ✅ Backend updates `is_verified = false`
5. ✅ Backend updates `verification_status = "rejected"`
6. ✅ Backend saves `rejection_reason`
7. ✅ Backend sets `verification_reviewed_at = NOW()`
8. ✅ Email sent to customer with reason
9. ✅ Frontend refreshes and shows "Rejected" badge

### Test Approve Provider
1. ✅ Admin clicks "Verify" button
2. ✅ Backend receives `PUT /api/admin/providers/:providerId/verify`
3. ✅ Backend updates `provider_isVerified = true`
4. ✅ Backend updates `verification_status = "approved"`
5. ✅ Backend clears `rejection_reason = null`
6. ✅ Backend sets `verification_reviewed_at = NOW()`
7. ✅ Email sent to provider
8. ✅ Frontend refreshes and shows "Verified" badge

### Test Reject Provider
1. ✅ Admin enters rejection reason
2. ✅ Admin clicks "Reject" button
3. ✅ Backend receives `PUT /api/admin/providers/:providerId/reject` with reason
4. ✅ Backend updates `provider_isVerified = false`
5. ✅ Backend updates `verification_status = "rejected"`
6. ✅ Backend saves `rejection_reason`
7. ✅ Backend sets `verification_reviewed_at = NOW()`
8. ✅ Email sent to provider with reason
9. ✅ Frontend refreshes and shows "Rejected" badge

---

## Expected Database State Examples

### After Approving Customer
```sql
user_id: 123
is_verified: true              -- ✅
verification_status: 'approved' -- ✅
rejection_reason: null
verification_reviewed_at: '2025-10-03 14:30:00'
```

### After Rejecting Customer
```sql
user_id: 123
is_verified: false             -- ✅
verification_status: 'rejected' -- ✅
rejection_reason: 'ID photo is blurry'
verification_reviewed_at: '2025-10-03 14:30:00'
```

### After Approving Provider
```sql
provider_id: 456
provider_isVerified: true       -- ✅
verification_status: 'approved'  -- ✅
rejection_reason: null
verification_reviewed_at: '2025-10-03 14:30:00'
```

### After Rejecting Provider
```sql
provider_id: 456
provider_isVerified: false      -- ✅
verification_status: 'rejected'  -- ✅
rejection_reason: 'Certificate images are not clear'
verification_reviewed_at: '2025-10-03 14:30:00'
```

---

## Summary

✅ **Approve** = Set both attributes to TRUE/APPROVED  
✅ **Reject** = Set both attributes to FALSE/REJECTED  
✅ Frontend is already calling correct endpoints  
✅ Backend must update both attributes simultaneously  
✅ This maintains data consistency across the system

---

**Last Updated:** October 3, 2025  
**Document Version:** 1.0  
**Status:** Specification Complete - Ready for Backend Implementation
