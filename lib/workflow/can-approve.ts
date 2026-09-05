import { determineWorkflow, type WorkflowInput } from "./determine-workflow"

type ApproveTask = WorkflowInput & {
  status: string
  pendingApproval: boolean
}

type ApproveUser = {
  id: string
  role: string
}

/**
 * Kiểm tra user có quyền duyệt task đang ở PENDING_APPROVAL không.
 * - Luồng 1 & 2: cần creator hoặc assignee (người giao) hoặc MANAGER/ADMIN duyệt
 * - Luồng 3: assignee (= executor) tự hoàn thành, không cần duyệt riêng (canApprove = false vì không qua PENDING_APPROVAL)
 */
export function canApprove(task: ApproveTask, user: ApproveUser): boolean {
  if (task.status !== "PENDING_APPROVAL" || !task.pendingApproval) return false
  if (user.role === "ADMIN") return true

  const workflow = determineWorkflow(task)

  if (workflow === 3) {
    // Luồng 3 không cần duyệt — task đi thẳng IN_PROGRESS → DONE
    return false
  }

  const isCreator = user.id === task.creatorId
  const isAssignee = user.id === task.assigneeId

  if (isCreator || isAssignee) return true
  if (user.role === "MANAGER") return true

  return false
}
