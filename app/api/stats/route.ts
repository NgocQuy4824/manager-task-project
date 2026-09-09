import { NextResponse } from "next/server"

import { getSession, unauthorized } from "@/lib/server-auth"
import { loadStats } from "@/lib/server/loaders"

export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || undefined

  const result = await loadStats(user, projectId)
  if ("forbidden" in result) return NextResponse.json({ error: "Không có quyền" }, { status: 403 })
  return NextResponse.json(result)
}
