import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { getSession, unauthorized, forbidden } from "@/lib/server-auth"
import { loadUsers } from "@/lib/server/loaders"
import { createUserSchema } from "@/lib/validations/user"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const user = await getSession()

  if (!user) {
    return unauthorized()
  }

  const { searchParams } = new URL(req.url)

  const search = searchParams.get("search")?.trim()

  const page = Math.max(
    1,
    Number(searchParams.get("page") ?? "1") || 1
  )

  const pageSize = Math.min(
    100,
    Math.max(
      1,
      Number(searchParams.get("pageSize") ?? "20") || 20
    )
  )

  const statusParam = searchParams.get("status")

  const status =
    statusParam === "ACTIVE" || statusParam === "INACTIVE"
      ? statusParam
      : "ALL"

  const result = await loadUsers({
    page,
    pageSize,
    search: search || undefined,
    status,
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await getSession()

  if (!user) {
    return unauthorized()
  }

  if (user.role !== "ADMIN") {
    return forbidden("Chỉ Admin được tạo người dùng")
  }

  const body = await req.json().catch(() => ({}))

  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      {
        status: 422,
      }
    )
  }

  const email = parsed.data.email.toLowerCase()

  const exists = await db.user.findUnique({
    where: {
      email,
    },
  })

  if (exists) {
    return NextResponse.json(
      {
        error: "Email đã tồn tại",
      },
      {
        status: 400,
      }
    )
  }

  const password = await bcrypt.hash(
    parsed.data.password,
    10
  )

  const created = await db.user.create({
    data: {
      email,
      password,
      name: parsed.data.name || null,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },

    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(
    {
      data: created,
    },
    {
      status: 201,
    }
  )
}