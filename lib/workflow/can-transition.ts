import type { TaskStatusType } from "@/lib/constants"
import { determineWorkflow, type WorkflowInput } from "./determine-workflow"

type TransitionTask = WorkflowInput & {
  status: TaskStatusType
  isDraft: boolean
  pendingApproval: boolean
}

type TransitionUser = {
  id: string
  role: string
}

// Ma trận chuyển trạng thái cho phép (đơn giản — sẽ mở rộng theo yêu cầu thực tế)
const ALLOWED_TRANSITIONS: Record<TaskStatusType, TaskStatusType[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["PENDING_APPROVAL", "TODO", "CANCELLED"],
  PENDING_APPROVAL: ["DONE", "IN_PROGRESS", "CANCELLED"],
  DONE: [],
  CANCELLED: ["TODO"],
}

export function canTransition(
  task: TransitionTask,
  user: TransitionUser,
  targetStatus: TaskStatusType,
): boolean {
  // Admin luôn được chuyển
  if (user.role === "ADMIN") return true

  // Kiểm tra ma trận chuyển trạng thái
  const allowed = ALLOWED_TRANSITIONS[task.status] ?? []
  if (!allowed.includes(targetStatus)) return false

  const workflow = determineWorkflow(task)
  const isCreator = user.id === task.creatorId
  const isAssignee = user.id === task.assigneeId
  const isExecutor = user.id === task.executorId

  // Luồng 1: cần quyền của creator/assignee để duyệt
  // Luồng 2: creator (= assignee) có quyền
  // Luồng 3: assignee (= executor) tự chuyển đến DONE không cần duyệt
  if (workflow === 3 && targetStatus === "DONE" && isExecutor) return true

  // Các trường hợp còn lại: chỉ creator/assignee hoặc MANAGER được chuyển sang PENDING_APPROVAL/DONE
  if (targetStatus === "PENDING_APPROVAL" && (isExecutor || isCreator)) return true
  if (targetStatus === "DONE" && (isAssignee || isCreator || user.role === "MANAGER"))
    return true

  // Chuyển thường (TODO ↔ IN_PROGRESS, CANCELLED) — executor hoặc creator được
  if (isExecutor || isCreator || isAssignee) return true

  return false
}
