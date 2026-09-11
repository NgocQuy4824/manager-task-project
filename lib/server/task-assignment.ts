import { db } from "@/lib/db"

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
