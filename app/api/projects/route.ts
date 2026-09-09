import { NextResponse } from "next/server"

import { getSession, unauthorized } from "@/lib/server-auth"
import { loadProjects } from "@/lib/server/loaders"
import { createProjectSchema } from "@/lib/validations/project"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.trim()
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20))

  const projects = await loadProjects(user, { page, pageSize, search: search || undefined })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const project = await db.project.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description ?? null,
      ownerId: user.id,
    },
  })

  return NextResponse.json({ data: project }, { status: 201 })
}
