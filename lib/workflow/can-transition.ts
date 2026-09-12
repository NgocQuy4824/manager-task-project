import type { TaskStatusType } from "@/lib/constants"
import type { WorkflowInput } from "./determine-workflow"

type TransitionTask = WorkflowInput & {
  status: TaskStatusType
  isDraft: boolean
  pendingApproval: boolean
  // Chủ sở hữu project (leader) — người có quyền nghiệm thu. Optional để
  // không phá các lời gọi cũ; thiếu thì chỉ MANAGER/ADMIN còn quyền review.
  projectOwnerId?: string | null
}

type TransitionUser = {
  id: string
  role: string
}

// Luồng tuyến tính: PENDING_APPROVAL → TODO → IN_PROGRESS → PENDING_ACCEPTANCE → DONE
// Nhánh trả về: IN_PROGRESS → TODO, PENDING_ACCEPTANCE → IN_PROGRESS, DONE → IN_PROGRESS
// Từ chối (REJECTED): chỉ ở 2 cổng phê duyệt — PENDING_APPROVAL → REJECTED, PENDING_ACCEPTANCE → REJECTED
// Làm lại: REJECTED → TODO. Không có đường nào trỏ về PENDING_APPROVAL (chỉ là trạng thái khởi điểm).
export const ALLOWED_TRANSITIONS: Record<TaskStatusType, TaskStatusType[]> = {
  PENDING_APPROVAL: ["TODO", "REJECTED"],
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["PENDING_ACCEPTANCE", "TODO"],
  PENDING_ACCEPTANCE: ["DONE", "IN_PROGRESS", "REJECTED"],
  DONE: ["IN_PROGRESS"],
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
  // Leader của project = chủ sở hữu. Đây mới là người có quyền NGHIỆM THU,
  // KHÔNG phải creator (tránh MEMBER tạo task rồi tự nghiệm thu task mình làm).
  const isProjectOwner = user.id === task.projectOwnerId
  // Người review ở cổng nghiệm thu: chủ project (leader) hoặc MANAGER toàn cục.
  const canReview = isProjectOwner || isManager

  switch (targetStatus) {
    // Duyệt khởi đầu (PENDING_APPROVAL → TODO): người tạo / người được giao / MANAGER
    case "TODO":
      if (task.status === "PENDING_APPROVAL")
        return isCreator || isAssignee || isManager
      // Trả về backlog (IN_PROGRESS → TODO): người tạo / người được giao / người làm / MANAGER
      if (task.status === "IN_PROGRESS")
        return isCreator || isAssignee || isExecutor || isManager
      // Làm lại (REJECTED → TODO): bất kỳ người liên quan
      return isCreator || isAssignee || isExecutor

    // Bắt đầu làm (TODO → IN_PROGRESS): người làm
    case "IN_PROGRESS":
      if (task.status === "TODO") return isExecutor || isAssignee
      // Trả về làm lại (PENDING_ACCEPTANCE → IN_PROGRESS): người review
      if (task.status === "PENDING_ACCEPTANCE") return canReview
      // Mở lại sau hoàn thành (DONE → IN_PROGRESS): người review
      return canReview

    // Gửi nghiệm thu (IN_PROGRESS → PENDING_ACCEPTANCE): người làm / người tạo
    case "PENDING_ACCEPTANCE":
      return isExecutor || isAssignee || isCreator

    // Nghiệm thu hoàn thành (PENDING_ACCEPTANCE → DONE): chỉ leader (chủ project) / MANAGER
    case "DONE":
      return canReview

    // Từ chối — chỉ ở 2 cổng phê duyệt:
    //  - PENDING_APPROVAL → REJECTED: người duyệt (creator / assignee / MANAGER)
    //  - PENDING_ACCEPTANCE → REJECTED: người nghiệm thu (leader / MANAGER)
    case "REJECTED":
      if (task.status === "PENDING_APPROVAL") return isCreator || isAssignee || isManager
      if (task.status === "PENDING_ACCEPTANCE") return canReview
      return false
  }

  return false
}
