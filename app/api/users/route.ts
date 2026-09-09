import { NextResponse } from "next/server"

import { getSession, unauthorized, forbidden } from "@/lib/server-auth"
import { loadUsers } from "@/lib/server/loaders"
import { createUserSchema } from "@/lib/validations/user"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden()

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.trim()
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20))

  const result = await loadUsers({ page, pageSize, search: search || undefined })
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()
  if (user.role !== "ADMIN") return forbidden("Chỉ Admin được tạo user")

  const body = await req.json().catch(() => ({}))
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return NextResponse.json({ error: "Email đã tồn tại" }, { status: 400 })

  const password = await bcrypt.hash(parsed.data.password, 10)
  const created = await db.user.create({
    data: {
      email: parsed.data.email,
      password,
      name: parsed.data.name,
      role: parsed.data.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  return NextResponse.json({ data: created }, { status: 201 })
}
