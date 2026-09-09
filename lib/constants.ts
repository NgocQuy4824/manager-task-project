export const ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const
export type RoleType = (typeof ROLES)[number]

export const TASK_STATUSES = [
  "PENDING_APPROVAL",
  "TODO",
  "IN_PROGRESS",
  "PENDING_ACCEPTANCE",
  "DONE",
  "REJECTED",
] as const
export type TaskStatusType = (typeof TASK_STATUSES)[number]

/** 6 cột cho Kanban board — thứ tự từ trái qua phải */
export const KANBAN_STATUSES: TaskStatusType[] = [
  "PENDING_APPROVAL",
  "TODO",
  "IN_PROGRESS",
  "PENDING_ACCEPTANCE",
  "DONE",
  "REJECTED",
]

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const
export type TaskPriorityType = (typeof TASK_PRIORITIES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatusType, string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  PENDING_ACCEPTANCE: "Chờ nghiệm thu",
  DONE: "Hoàn thành",
  REJECTED: "Bị từ chối",
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
