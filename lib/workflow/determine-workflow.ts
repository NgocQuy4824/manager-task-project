/**
 * Xác định "luồng" (workflow) của task dựa trên creator / assignee / executor.
 * - Luồng 1: creator ≠ assignee, assignee ≠ executor, creator ≠ executor (3 người khác nhau)
 * - Luồng 2: creator = assignee, khác executor
 * - Luồng 3: assignee = executor (người giao cũng là người làm)
 */
export type WorkflowType = 1 | 2 | 3

export type WorkflowInput = {
  creatorId: string
  assigneeId: string | null
  executorId: string | null
}

export function determineWorkflow(task: WorkflowInput): WorkflowType {
  const { creatorId, assigneeId, executorId } = task

  // Chưa gán → mặc định luồng 1 (cần duyệt)
  if (!assigneeId || !executorId) return 1

  if (creatorId === assigneeId && assigneeId !== executorId) return 2
  if (assigneeId === executorId) return 3
  return 1
}
