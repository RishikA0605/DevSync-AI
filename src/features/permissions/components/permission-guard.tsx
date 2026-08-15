"use client";

import { WorkspaceRole } from "@prisma/client";
import { Permission } from "../types";
import { usePermissions } from "../hooks/use-permissions";

interface PermissionGuardProps {
  role: WorkspaceRole;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  role,
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions(role);

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
