export const ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const
export type RoleType = (typeof ROLES)[number]

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "PENDING_APPROVAL",
  "DONE",
  "CANCELLED",
] as const
export type TaskStatusType = (typeof TASK_STATUSES)[number]

/** 4 cột cho Kanban board */
export const KANBAN_STATUSES: TaskStatusType[] = [
  "TODO",
  "IN_PROGRESS",
  "PENDING_APPROVAL",
  "DONE",
]

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const
export type TaskPriorityType = (typeof TASK_PRIORITIES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatusType, string> = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  PENDING_APPROVAL: "Chờ duyệt",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

export const TASK_PRIORITY_LABELS: Record<TaskPriorityType, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
}

export const ROLE_LABELS: Record<RoleType, string> = {
  ADMIN: "Quản trị",
  MANAGER: "Quản lý",
  MEMBER: "Thành viên",
}
