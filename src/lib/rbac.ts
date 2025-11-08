// Role-Based Access Control (RBAC) utilities

export type AdminRole = 'operations' | 'verification' | 'super_admin';

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove?: boolean;
  canReject?: boolean;
}

// Define permissions for each role on each module
export const rolePermissions: Record<AdminRole, Record<string, Permission>> = {
  verification: {
    users: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canApprove: true,
      canReject: true,
    },
    serviceProviders: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canApprove: true,
      canReject: true,
    },
    certificates: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: true,
      canReject: true,
    },
    appointments: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    penalties: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    admins: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  },
  operations: {
    users: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    serviceProviders: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    certificates: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    appointments: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    penalties: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    admins: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  },
  super_admin: {
    users: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    serviceProviders: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    certificates: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    appointments: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    penalties: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
    },
    admins: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
  },
};

// Check if user has permission for a specific action
export function hasPermission(
  role: AdminRole | null | undefined,
  module: string,
  action: keyof Permission
): boolean {
  if (!role) return false;
  
  const modulePermissions = rolePermissions[role]?.[module];
  if (!modulePermissions) return false;
  
  return modulePermissions[action] === true;
}

// Check if user can access a module at all
export function canAccessModule(
  role: AdminRole | null | undefined,
  module: string
): boolean {
  if (!role) return false;
  
  const modulePermissions = rolePermissions[role]?.[module];
  if (!modulePermissions) return false;
  
  return modulePermissions.canView === true;
}

// Get all permissions for a module
export function getModulePermissions(
  role: AdminRole | null | undefined,
  module: string
): Permission | null {
  if (!role) return null;
  return rolePermissions[role]?.[module] || null;
}

// Check if user is view-only for a module
export function isViewOnly(
  role: AdminRole | null | undefined,
  module: string
): boolean {
  if (!role) return true;
  
  const permissions = getModulePermissions(role, module);
  if (!permissions) return true;
  
  return permissions.canView && 
         !permissions.canCreate && 
         !permissions.canEdit && 
         !permissions.canDelete;
}
