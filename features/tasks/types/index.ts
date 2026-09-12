import type { TaskStatusType, TaskPriorityType } from "@/lib/constants"

export type TaskTransitionItem = {
  id: string
  from: TaskStatusType | null
  to: TaskStatusType
  actorId: string
  reason: string | null
  createdAt: string
  actor?: { id: string; name: string | null; email: string }
}

export type TaskItem = {
  id: string
  title: string
  description: string | null
  status: TaskStatusType
  priority: TaskPriorityType
  dueDate: string | null
  isDraft: boolean
  pendingApproval: boolean
  reviewNote: string | null
  projectId: string
  creatorId: string
  assigneeId: string | null
  executorId: string | null
  createdAt: string
  updatedAt: string
  creator?: { id: string; name: string | null; email: string }
  assignee?: { id: string; name: string | null; email: string; isActive?: boolean } | null
  executor?: { id: string; name: string | null; email: string; isActive?: boolean } | null
  project?: { id: string; name: string; ownerId?: string }
  transitions?: TaskTransitionItem[]
}

export type TasksResponse = {
  data: TaskItem[]
  total: number
  page: number
  pageSize: number
}

export type TaskFilters = {
  projectId?: string
  status?: string
  priority?: string
  assigneeId?: string
  executorId?: string
  creatorId?: string
  search?: string
  page?: number
  pageSize?: number
}
