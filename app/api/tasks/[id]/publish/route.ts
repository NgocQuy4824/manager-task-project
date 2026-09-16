import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound, conflict, canAccessProject } from "@/lib/server-auth"
import { validateTaskAssignment, deriveCreateStatus } from "@/lib/server/task-assignment"

/**
 * POST /api/tasks/[id]/publish — Chuyển bản nháp (Lưu nháp) thành giao chính thức ("Giao việc").
 * Chỉ creator (hoặc ADMIN) được bấm. Server tự suy diễn lại Luồng 1/2/3 bằng
 * deriveCreateStatus({ intent: "assign", ... }) y hệt lúc tạo mới — không tin client.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task) return notFound("Task không tồn tại")

  const isCreator = task.creatorId === user.id
  if (user.role !== "ADMIN" && !isCreator) return forbidden("Chỉ người tạo mới được giao việc từ bản nháp")
  if (!(await canAccessProject(user, task.projectId))) return forbidden()
  if (!task.isDraft) return conflict("Task đã được giao việc, không còn là bản nháp")

  // Vai trò người được giao / người thực hiện có thể đã đổi kể từ lúc lưu nháp.
  const assignmentErr = await validateTaskAssignment(task.projectId, {
    assigneeId: task.assigneeId,
    executorId: task.executorId,
  })
  if (assignmentErr) return NextResponse.json({ error: assignmentErr.message }, { status: 422 })

  const derived = deriveCreateStatus(
    { intent: "assign", assigneeId: task.assigneeId, executorId: task.executorId },
    task.creatorId,
  )

  const updated = await db.task.update({
    where: { id: params.id },
    data: {
      status: derived.status as never,
      isDraft: false,
      pendingApproval: derived.pendingApproval,
    } as never,
  })

  // Ghi lịch sử: từ nháp (TODO) sang trạng thái giao chính thức.
  await db.taskTransition.create({
    data: {
      taskId: task.id,
      from: task.status as never,
      to: derived.status as never,
      actorId: user.id,
      reason: null,
    },
  })

  return NextResponse.json({ data: updated })
}
