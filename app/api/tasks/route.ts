import { NextResponse } from "next/server"

import { getSession, unauthorized, forbidden } from "@/lib/server-auth"
import { loadTasks } from "@/lib/server/loaders"
import { createTaskSchema, taskQuerySchema } from "@/lib/validations/task"
import { canAccessProject } from "@/lib/server-auth"
import { db } from "@/lib/db"
import { validateTaskAssignment } from "@/lib/server/task-assignment"

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

  const task = await db.task.create({
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description ?? null,
      status: parsed.data.status as never,
      priority: parsed.data.priority as never,
      dueDate: parsed.data.dueDate ?? null,
      isDraft: parsed.data.isDraft ?? false,
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
      to: parsed.data.status as never,
      actorId: user.id,
      reason: null,
    },
  })

  return NextResponse.json({ data: task }, { status: 201 })
}
