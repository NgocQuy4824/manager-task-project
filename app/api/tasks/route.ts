import { NextResponse } from "next/server"

import { getSession, unauthorized, forbidden } from "@/lib/server-auth"
import { loadTasks } from "@/lib/server/loaders"
import { createTaskSchema, taskQuerySchema } from "@/lib/validations/task"
import { canAccessProject } from "@/lib/server-auth"
import { db } from "@/lib/db"
import { validateTaskAssignment, deriveCreateStatus } from "@/lib/server/task-assignment"

export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const parsed = taskQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const result = await loadTasks(user, parsed.data)
  if (result && typeof result === "object" && "forbidden" in result) return forbidden()
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  if (!(await canAccessProject(user, parsed.data.projectId))) return forbidden()

  const assignmentErr = await validateTaskAssignment(parsed.data.projectId, {
    assigneeId: parsed.data.assigneeId ?? null,
    executorId: parsed.data.executorId ?? null,
  })
  if (assignmentErr) return NextResponse.json({ error: assignmentErr.message }, { status: 422 })

  // Server suy diễn trạng thái khởi tạo — client không được tự chọn (Lưu ≠ Giao việc, 3 luồng).
  const derived = deriveCreateStatus(
    {
      intent: parsed.data.intent,
      assigneeId: parsed.data.assigneeId ?? null,
      executorId: parsed.data.executorId ?? null,
    },
    user.id,
  )

  const task = await db.task.create({
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description ?? null,
      status: derived.status as never,
      priority: parsed.data.priority as never,
      dueDate: parsed.data.dueDate ?? null,
      isDraft: derived.isDraft,
      pendingApproval: derived.pendingApproval,
      projectId: parsed.data.projectId,
      creatorId: user.id,
      assigneeId: parsed.data.assigneeId ?? null,
      executorId: parsed.data.executorId ?? null,
    },
  })

  // Mốc khởi tạo trên timeline lịch sử
  await db.taskTransition.create({
    data: {
      taskId: task.id,
      from: null,
      to: derived.status as never,
      actorId: user.id,
      reason: null,
    },
  })

  return NextResponse.json({ data: task }, { status: 201 })
}
