# RBAC Implementation Guide for Fixmo Admin

## Overview
The Role-Based Access Control (RBAC) system has been implemented for the Fixmo Admin dashboard with three roles:

### Roles and Their Permissions

#### 1. **Verification Team** (`verification`)
- **User Management**: Full access (view, create, edit, approve, reject)
- **Service Providers**: Full access (view, create, edit, approve, reject)
- **Certificates**: Can view, approve, and reject
- **Appointments**: No access
- **Penalties**: No access
- **Admin Management**: No access

#### 2. **Operations** (`operations`)
- **User Management**: View-only access
- **Service Providers**: View-only access
- **Certificates**: View-only access
- **Appointments**: Full access (view, create, edit, delete, cancel)
- **Penalties**: Full access (view, create, edit, delete, adjust)
- **Admin Management**: No access

#### 3. **Super Administrator** (`super_admin`)
- Full access to all modules

---

## How to Implement RBAC in Your Pages

### 1. Import Required Components and Hooks

```typescript
import { useRBAC } from "@/lib/useRBAC";
import { ViewOnlyBanner } from "@/components/ViewOnlyBanner";
import { PermissionGuard } from "@/components/PermissionGuard";
```

### 2. Use the RBAC Hook in Your Component

```typescript
export default function YourPage() {
  const { canCreate, canEdit, canDelete, canApprove, isViewOnly } = useRBAC('users');
  
  // Your component logic
}
```

### 3. Add View-Only Banner

```typescript
return (
  <div className="p-6">
    <ViewOnlyBanner module="users" />
    {/* Rest of your page */}
  </div>
);
```

### 4. Protect Action Buttons

```typescript
{/* Only show if user has create permission */}
<PermissionGuard module="users" action="canCreate">
  <button onClick={handleAddUser}>
    Add New User
  </button>
</PermissionGuard>

{/* Only show if user has edit permission */}
<PermissionGuard module="users" action="canEdit">
  <button onClick={handleEdit}>
    Edit
  </button>
</PermissionGuard>

{/* Only show if user has delete permission */}
<PermissionGuard module="users" action="canDelete">
  <button onClick={handleDelete}>
    Delete
  </button>
</PermissionGuard>

{/* Only show if user has approve permission */}
<PermissionGuard module="users" action="canApprove">
  <button onClick={handleApprove}>
    Approve
  </button>
</PermissionGuard>
```

### 5. Conditional Rendering with Hook

```typescript
const { canCreate, canEdit, isViewOnly } = useRBAC('users');

return (
  <div>
    {canCreate && (
      <button onClick={handleCreate}>Create</button>
    )}
    
    {canEdit && (
      <button onClick={handleEdit}>Edit</button>
    )}
    
    {isViewOnly && (
      <p className="text-gray-500">View-only access</p>
    )}
  </div>
);
```

---

## Module Names

Use these exact module names when calling `useRBAC()`:

- `users` - User Management
- `serviceProviders` - Service Provider Management
- `certificates` - Certificate Management
- `appointments` - Appointment Management
- `penalties` - Penalty Management
- `admins` - Admin Management

---

## Example Implementation

### Users Page with RBAC

```typescript
"use client";

import { useRBAC } from "@/lib/useRBAC";
import { ViewOnlyBanner } from "@/components/ViewOnlyBanner";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function UsersPage() {
  const { canCreate, canEdit, canApprove, canReject, isViewOnly } = useRBAC('users');

  return (
    <div className="p-6">
      <ViewOnlyBanner module="users" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        
        <PermissionGuard module="users" action="canCreate">
          <button className="btn-primary">
            Add New User
          </button>
        </PermissionGuard>
      </div>

      {/* Users table */}
      <table>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>
                <PermissionGuard module="users" action="canEdit">
                  <button>Edit</button>
                </PermissionGuard>
                
                <PermissionGuard module="users" action="canApprove">
                  <button>Approve</button>
                </PermissionGuard>
                
                <PermissionGuard module="users" action="canReject">
                  <button>Reject</button>
                </PermissionGuard>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Next Steps

Apply RBAC to these pages:

1. ✅ **Sidebar** - Already updated with role-based menu items
2. ⏳ **User Management** (`/dashboard/users/page.tsx`)
3. ⏳ **Service Providers** (`/dashboard/service-providers/page.tsx`)
4. ⏳ **Certificates** (`/dashboard/certificates/page.tsx`)
5. ⏳ **Appointments** (`/dashboard/appointments/page.tsx`)
6. ⏳ **Penalties** (`/dashboard/penalties/page.tsx`)

---

## Testing RBAC

1. Create test accounts for each role
2. Log in with each role and verify:
   - Correct menu items are visible
   - View-only banners appear where appropriate
   - Action buttons are hidden/shown correctly
   - API calls respect permissions (backend enforcement)
