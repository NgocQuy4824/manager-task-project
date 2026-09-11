import { NextResponse } from "next/server"

import {
  getSession,
  unauthorized,
  forbidden,
} from "@/lib/server-auth"

import { loadStats } from "@/lib/server/loaders"

export async function GET(req: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(req.url)

    const projectId = searchParams.get("projectId")?.trim() || undefined

    const result = await loadStats(user, projectId)

    if ("forbidden" in result) {
      return forbidden()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/stats error:", error)

    return NextResponse.json(
      {
        error: "Không thể tải dữ liệu thống kê",
      },
      {
        status: 500,
      }
    )
  }
}