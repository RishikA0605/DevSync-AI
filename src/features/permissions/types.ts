export type Permission =
  // Workspace Management
  | "workspace:delete"
  | "workspace:transfer"
  | "workspace:update"

  // Member Management
  | "member:manage" // Add/Remove members
  | "member:change_role" // Change roles of members

  // Invite Management
  | "invite:manage"

  // Projects
  | "project:create"
  | "project:update"
  | "project:view"

  // Tasks
  | "task:create"
  | "task:update"
  | "task:delete"
  | "task:view"

  // Files
  | "file:upload"
  | "file:delete"
  | "file:view"

  // Notes
  | "note:create"
  | "note:update"
  | "note:delete"
  | "note:view"

  // Chat
  | "chat:send"
  | "chat:view"

  // Analytics
  | "analytics:view";
