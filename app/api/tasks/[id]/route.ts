import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound } from "@/lib/server-auth"
import { updateTaskSchema } from "@/lib/validations/task"
import { canAccessProject } from "@/lib/server-auth"
import { validateTaskAssignment } from "@/lib/server/task-assignment"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const task = await db.task.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true, isActive: true } },
      executor: { select: { id: true, name: true, email: true, isActive: true } },
      project: { select: { id: true, name: true, ownerId: true } },
      transitions: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  })
  if (!task) return notFound("Task không tồn tại")
  if (!(await canAccessProject(user, task.projectId))) return forbidden()

  return NextResponse.json({ data: task })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task) return notFound()

  const isCreator = task.creatorId === user.id
  const isAssignee = task.assigneeId === user.id
  const isExecutor = task.executorId === user.id
  if (user.role !== "ADMIN" && !isCreator && !isAssignee && !isExecutor) return forbidden()
  if (!(await canAccessProject(user, task.projectId))) return forbidden()

  const body = await req.json().catch(() => ({}))
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim()
  if (parsed.data.description !== undefined) data.description = parsed.data.description
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority
  if (parsed.data.dueDate !== undefined) data.dueDate = parsed.data.dueDate
  if (parsed.data.isDraft !== undefined) data.isDraft = parsed.data.isDraft
  if (parsed.data.pendingApproval !== undefined) data.pendingApproval = parsed.data.pendingApproval

  const assigneeChanged = parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== task.assigneeId
  const executorChanged = parsed.data.executorId !== undefined && parsed.data.executorId !== task.executorId
  const assignmentErr = await validateTaskAssignment(task.projectId, {
    assigneeId: assigneeChanged ? (parsed.data.assigneeId ?? null) : null,
    executorId: executorChanged ? (parsed.data.executorId ?? null) : null,
  })
  if (assignmentErr) return NextResponse.json({ error: assignmentErr.message }, { status: 422 })
  if (parsed.data.assigneeId !== undefined) data.assigneeId = parsed.data.assigneeId
  if (parsed.data.executorId !== undefined) data.executorId = parsed.data.executorId

  if (parsed.data.status !== undefined) {
    // Bị từ chối chỉ được tạo qua /transition (bắt buộc có lý do + lịch sử)
    if (parsed.data.status === "REJECTED") {
      return NextResponse.json({ error: "Không thể đặt Bị từ chối trực tiếp; vui lòng dùng chức năng Từ chối." }, { status: 422 })
    }
    data.status = parsed.data.status
    if (parsed.data.status === "PENDING_APPROVAL") data.pendingApproval = true
    if (parsed.data.status === "PENDING_ACCEPTANCE") data.pendingApproval = false
    if (parsed.data.status === "DONE") {
      data.pendingApproval = false
      data.isDraft = false
    }
  }

  const updated = await db.task.update({ where: { id: params.id }, data: data as never })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task) return notFound()

  const isCreator = task.creatorId === user.id
  if (user.role !== "ADMIN" && !isCreator) return forbidden("Chỉ creator hoặc Admin được xóa task")

  await db.task.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
