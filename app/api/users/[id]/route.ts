import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound, badRequest, conflict } from "@/lib/server-auth"
import { updateUserSchema } from "@/lib/validations/user"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()
  if (user.role !== "ADMIN" && user.role !== "MANAGER" && user.id !== params.id)
    return forbidden()

  const found = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, image: true },
  })
  if (!found) return notFound("User không tồn tại")
  return NextResponse.json({ data: found })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const isSelf = user.id === params.id
  const isAdmin = user.role === "ADMIN"
  if (!isSelf && !isAdmin) return forbidden()

  const body = await req.json().catch(() => ({}))
  if (body.password) {
    if (!isSelf && !isAdmin) return forbidden()
    body.password = await bcrypt.hash(String(body.password), 10)
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  if (parsed.data.role && !isAdmin) return forbidden("Chỉ Admin được đổi role")
  if (parsed.data.email && !isAdmin && !isSelf) return forbidden()

  if (parsed.data.email) {
    const clash = await db.user.findUnique({ where: { email: parsed.data.email } })
    if (clash && clash.id !== params.id) return badRequest("Email đã tồn tại")
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.email !== undefined) data.email = parsed.data.email
  if (parsed.data.role !== undefined) data.role = parsed.data.role
  if (body.password) data.password = body.password

  const updated = await db.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, updatedAt: true },
  }).catch(() => null)
  if (!updated) return notFound()

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()
  if (user.role !== "ADMIN") return forbidden("Chỉ Admin được xóa user")
  if (user.id === params.id) return badRequest("Không thể tự xóa chính mình")

  const target = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!target) return notFound("User không tồn tại")

  const [ownedCount, createdCount] = await Promise.all([
    db.project.count({ where: { ownerId: params.id } }),
    db.task.count({ where: { creatorId: params.id } }),
  ])
  if (ownedCount > 0)
    return conflict(
      `Không thể xóa: user còn sở hữu ${ownedCount} project. Hãy chuyển quyền sở hữu hoặc xóa các project đó trước.`,
    )
  if (createdCount > 0)
    return conflict(
      `Không thể xóa: user còn là người tạo của ${createdCount} task. Hãy xóa hoặc chuyển các task đó trước.`,
    )

  // ProjectMember: chỉ là quan hệ thành viên, an toàn để gỡ trước khi xóa user
  await db.projectMember.deleteMany({ where: { userId: params.id } })

  // assigneeId / executorId là nullable → Prisma không chặn, nhưng dọn cho sạch hiển thị
  await Promise.all([
    db.task.updateMany({ where: { assigneeId: params.id }, data: { assigneeId: null } }),
    db.task.updateMany({ where: { executorId: params.id }, data: { executorId: null } }),
  ])

  try {
    await db.user.delete({ where: { id: params.id } })
  } catch (e: unknown) {
    const msg =
      e != null && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2014"
        ? "Không thể xóa: user vẫn còn dữ liệu liên quan (project/task). Hãy xử lý các dữ liệu đó trước."
        : "Không thể xóa user do lỗi hệ thống."
    const status = msg.includes("vẫn còn") ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }

  return NextResponse.json({ ok: true })
}
