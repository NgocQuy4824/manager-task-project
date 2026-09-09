import type { TaskStatusType } from "@/lib/constants"
import type { WorkflowInput } from "./determine-workflow"

type TransitionTask = WorkflowInput & {
  status: TaskStatusType
  isDraft: boolean
  pendingApproval: boolean
}

type TransitionUser = {
  id: string
  role: string
}

// Luồng tuyến tính: PENDING_APPROVAL → TODO → IN_PROGRESS → PENDING_ACCEPTANCE → DONE
// Nhánh phụ: PENDING_ACCEPTANCE → TODO (yêu cầu làm lại), DONE → REJECTED (từ chối), REJECTED → TODO (làm lại)
// Không có đường nào trỏ về PENDING_APPROVAL (chỉ là trạng thái khởi điểm).
export const ALLOWED_TRANSITIONS: Record<TaskStatusType, TaskStatusType[]> = {
  PENDING_APPROVAL: ["TODO"],
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["PENDING_ACCEPTANCE"],
  PENDING_ACCEPTANCE: ["DONE", "TODO"],
  DONE: ["REJECTED"],
  REJECTED: ["TODO"],
}

export function isAllowedAdjacent(from: TaskStatusType, to: TaskStatusType): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

export function canTransition(
  task: TransitionTask,
  user: TransitionUser,
  targetStatus: TaskStatusType,
): boolean {
  // Kiểm tra ma trận chuyển trạng thái — áp dụng cho mọi role kể cả ADMIN:
  // không được nhảy cóc (chỉ đi tới trạng thái kề hợp lệ) và không đường nào quay về PENDING_APPROVAL.
  const allowed = ALLOWED_TRANSITIONS[task.status] ?? []
  if (!allowed.includes(targetStatus)) return false

  // Sau khi đã hợp lệ theo ma trận, ADMIN được thực hiện mọi hành động (không cần là người liên quan).
  if (user.role === "ADMIN") return true

  const isCreator = user.id === task.creatorId
  const isAssignee = user.id === task.assigneeId
  const isExecutor = user.id === task.executorId
  const isManager = user.role === "MANAGER"

  switch (targetStatus) {
    // Duyệt khởi đầu (PENDING_APPROVAL → TODO): người tạo / người được giao / MANAGER
    case "TODO":
      if (task.status === "PENDING_APPROVAL")
        return isCreator || isAssignee || isManager
      // Yêu cầu làm lại (PENDING_ACCEPTANCE → TODO): người review
      if (task.status === "PENDING_ACCEPTANCE")
        return isCreator || isManager
      // Làm lại (REJECTED → TODO): bất kỳ người liên quan
      return isCreator || isAssignee || isExecutor

    // Bắt đầu làm (TODO → IN_PROGRESS): người làm
    case "IN_PROGRESS":
      return isExecutor || isAssignee

    // Gửi nghiệm thu (IN_PROGRESS → PENDING_ACCEPTANCE): người làm / người tạo
    case "PENDING_ACCEPTANCE":
      return isExecutor || isAssignee || isCreator

    // Nghiệm thu hoàn thành (PENDING_ACCEPTANCE → DONE): người review
    case "DONE":
      return isCreator || isManager

    // Từ chối sau hoàn thành (DONE → REJECTED): người liên quan / MANAGER
    case "REJECTED":
      return isCreator || isAssignee || isManager
  }

  return false
}
