import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  role: string
}

/** Lấy session server-side. Trả về null nếu chưa đăng nhập. */
export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
}

export function forbidden(msg = "Không có quyền thực hiện") {
  return NextResponse.json({ error: msg }, { status: 403 })
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

export function notFound(msg = "Không tìm thấy") {
  return NextResponse.json({ error: msg }, { status: 404 })
}

export function conflict(msg: string) {
  return NextResponse.json({ error: msg }, { status: 409 })
}

/** Kiểm tra user có quyền truy cập project không (owner / member / ADMIN). */
export async function canAccessProject(
  user: SessionUser,
  projectId: string,
): Promise<boolean> {
  if (user.role === "ADMIN") return true
  // Chạy song song thay vì tuần tự — tiết kiệm 1 round-trip Mongo.
  const [project, member] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { ownerId: true } }),
    db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { id: true },
    }),
  ])
  if (!project) return false
  return project.ownerId === user.id || !!member
}
