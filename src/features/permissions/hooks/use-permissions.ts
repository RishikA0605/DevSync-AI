import { WorkspaceRole } from "@prisma/client";
import { Permission } from "../types";
import { hasPermission as checkPermission } from "../utils/has-permission";
import { useCallback } from "react";

export function usePermissions(role: WorkspaceRole) {
  const hasPermission = useCallback(
    (permission: Permission) => {
      return checkPermission(role, permission);
    },
    [role]
  );

  return { hasPermission };
}
