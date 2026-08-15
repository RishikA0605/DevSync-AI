import { WorkspaceRole } from "@prisma/client";
import { Permission } from "../types";
import { ROLE_PERMISSIONS } from "../role-permissions";

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
