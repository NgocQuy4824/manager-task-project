import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound } from "@/lib/server-auth"
import { updateProjectSchema } from "@/lib/validations/project"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      _count: { select: { tasks: true } },
      members: { select: { id: true, userId: true, projectId: true, role: true } },
    },
  })
  if (!project) return notFound("Project không tồn tại")

  const isOwner = project.ownerId === user.id
  const isMember = project.members.some((m) => m.userId === user.id)
  if (user.role !== "ADMIN" && !isOwner && !isMember) return forbidden()

  // Ghép owner và user của member thủ công thay vì `include` quan hệ bắt buộc:
  // trên MongoDB không có ràng buộc toàn vẹn, nếu ownerId/userId trỏ tới user đã
  // bị xóa thì `include` sẽ ném lỗi 500. Ở đây owner thiếu -> null, member mà user
  // đã mất -> loại khỏi danh sách, để còn mở được project thay vì sập cả trang.
  const memberUserIds = Array.from(new Set(project.members.map((m) => m.userId)))
  const [owner, memberUsers] = await Promise.all([
    db.user.findUnique({ where: { id: project.ownerId }, select: { id: true, name: true, email: true } }),
    memberUserIds.length
      ? db.user.findMany({
          where: { id: { in: memberUserIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : Promise.resolve([]),
  ])
  const userMap = new Map(memberUsers.map((u) => [u.id, u]))
  const members = project.members.flatMap((m) => {
    const u = userMap.get(m.userId)
    return u ? [{ ...m, user: u }] : []
  })

  return NextResponse.json({ data: { ...project, owner, members } })
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
