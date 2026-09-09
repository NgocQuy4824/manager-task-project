import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound } from "@/lib/server-auth"
import { updateProjectSchema } from "@/lib/validations/project"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      _count: { select: { tasks: true } },
    },
  })
  if (!project) return notFound("Project không tồn tại")

  const isOwner = project.ownerId === user.id
  const isMember = project.members.some((m) => m.userId === user.id)
  if (user.role !== "ADMIN" && !isOwner && !isMember) return forbidden()

  return NextResponse.json({ data: project })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({ where: { id: params.id } })
  if (!project) return notFound()

  const isOwner = project.ownerId === user.id
  if (user.role !== "ADMIN" && !isOwner) return forbidden("Chỉ owner hoặc Admin được sửa project")

  const body = await req.json().catch(() => ({}))
  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const updated = await db.project.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({ where: { id: params.id } })
  if (!project) return notFound()

  if (project.ownerId !== user.id && user.role !== "ADMIN") return forbidden()

  // MongoDB không có cascade — xóa thủ công
  await db.task.deleteMany({ where: { projectId: params.id } })
  await db.projectMember.deleteMany({ where: { projectId: params.id } })
  await db.project.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
