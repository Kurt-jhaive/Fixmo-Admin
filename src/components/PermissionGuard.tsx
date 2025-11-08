"use client";

import { useRBAC } from "@/lib/useRBAC";
import { Permission } from "@/lib/rbac";

interface PermissionGuardProps {
  module: string;
  action: keyof Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ module, action, children, fallback = null }: PermissionGuardProps) {
  const { checkPermission } = useRBAC(module);

  if (!checkPermission(action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
