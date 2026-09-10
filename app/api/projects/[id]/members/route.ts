import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound } from "@/lib/server-auth"

const addMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]).default("MEMBER"),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, members: { select: { id: true, userId: true, projectId: true, role: true } } },
  })
  if (!project) return notFound()

  const isOwner = project.ownerId === user.id
  const isMember = project.members.some((m) => m.userId === user.id)
  if (user.role !== "ADMIN" && !isOwner && !isMember) return forbidden()

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

  return NextResponse.json({ data: members, owner })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, members: { select: { userId: true, role: true } } },
  })
  if (!project) return notFound()

  const isOwner = project.ownerId === user.id
  const canGrantPrivilegedRole = user.role === "ADMIN" || isOwner
  const canAddMember = canGrantPrivilegedRole
  if (!canAddMember) return forbidden("Chỉ chủ sở hữu project (hoặc Admin hệ thống) được mời thành viên")

  const body = await req.json().catch(() => ({}))
  const parsed = addMemberSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  if (parsed.data.userId === project.ownerId) {
    return NextResponse.json({ error: "Owner đã là thành viên" }, { status: 400 })
  }

  const targetUser = await db.user.findUnique({ where: { id: parsed.data.userId } })
  if (!targetUser) return notFound("User không tồn tại")

  const member = await db.projectMember.upsert({
    where: { projectId_userId: { projectId: params.id, userId: parsed.data.userId } },
    update: { role: parsed.data.role },
    create: { projectId: params.id, userId: parsed.data.userId, role: parsed.data.role },
  })

  return NextResponse.json({ data: member }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const project = await db.project.findUnique({ where: { id: params.id } })
  if (!project) return notFound()

  const isOwner = project.ownerId === user.id
  if (user.role !== "ADMIN" && !isOwner) return forbidden("Chỉ owner/Admin được xóa member")

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "Thiếu userId" }, { status: 422 })

  await db.projectMember.delete({ where: { projectId_userId: { projectId: params.id, userId } } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
