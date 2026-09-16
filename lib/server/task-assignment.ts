import { db } from "@/lib/db"
import type { TaskStatusType } from "@/lib/constants"

const LEADER_ROLES = ["ADMIN", "MANAGER"] as const

export type AssignmentError = { field: "assigneeId" | "executorId"; message: string }

export async function validateTaskAssignment(
  projectId: string,
  input: { assigneeId?: string | null; executorId?: string | null },
): Promise<AssignmentError | null> {
  const project = await db.project.findUnique({ where: { id: projectId }, select: { ownerId: true } })
  if (!project) return { field: "assigneeId", message: "Project không tồn tại" }

  for (const field of ["assigneeId", "executorId"] as const) {
    const userId = input[field]
    if (!userId) continue
    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } })
    if (!target) return { field, message: "Người được gán không tồn tại" }
    if (target.isActive === false) return { field, message: "Không thể gán cho tài khoản đã bị vô hiệu hóa" }

    if (project.ownerId === userId) continue
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    })
    if (!membership) return { field, message: "Người được gán phải là thành viên của project" }
    if (field === "assigneeId" && !(LEADER_ROLES as readonly string[]).includes(membership.role)) {
      return { field, message: "Người được giao phải là Quản lý, Quản trị hoặc chủ sở hữu project" }
    }
  }
  return null
}

/**
 * Suy diễn trạng thái khởi tạo của task từ intent + quan hệ creator/assignee/executor.
 * Nguồn sự thật duy nhất cho rule "Lưu ≠ Giao việc" và 3 luồng nghiệp vụ:
 * - "draft" (Lưu nháp) → nháp, người thực hiện chưa thấy.
 * - "assign" + assignee trùng executor (Luồng 3: tự giao tự làm) → TODO ngay.
 * - "assign" + có assignee khác creator (Luồng 1) → PENDING_APPROVAL trình người giao.
 * - "assign" còn lại — không assignee, hoặc assignee chính là creator (Luồng 2) →
 *   TODO ngay (creator đồng thời là người duyệt nên giao trực tiếp được).
 */
export function deriveCreateStatus(
  input: { intent?: "draft" | "assign"; assigneeId?: string | null; executorId?: string | null },
  creatorId: string,
): { status: TaskStatusType; isDraft: boolean; pendingApproval: boolean } {
  if (input.intent === "draft") {
    return { status: "TODO", isDraft: true, pendingApproval: false }
  }
  const assigneeId = input.assigneeId ?? null
  const executorId = input.executorId ?? null
  if (assigneeId && executorId && assigneeId === executorId) {
    return { status: "TODO", isDraft: false, pendingApproval: false }
  }
  if (assigneeId && assigneeId !== creatorId) {
    return { status: "PENDING_APPROVAL", isDraft: false, pendingApproval: true }
  }
  return { status: "TODO", isDraft: false, pendingApproval: false }
}
