"use client";

import { useState, useEffect } from 'react';
import { authApi } from './api';
import { AdminRole, hasPermission, canAccessModule, getModulePermissions, isViewOnly, Permission } from './rbac';

export function useRBAC(module: string) {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authApi.getStoredUser();
    if (user && user.role) {
      setRole(user.role as AdminRole);
      setPermissions(getModulePermissions(user.role as AdminRole, module));
    }
    setLoading(false);
  }, [module]);

  return {
    role,
    permissions,
    loading,
    canView: permissions?.canView || false,
    canCreate: permissions?.canCreate || false,
    canEdit: permissions?.canEdit || false,
    canDelete: permissions?.canDelete || false,
    canApprove: permissions?.canApprove || false,
    canReject: permissions?.canReject || false,
    isViewOnly: isViewOnly(role, module),
    hasAccess: canAccessModule(role, module),
    checkPermission: (action: keyof Permission) => hasPermission(role, module, action),
  };
}
