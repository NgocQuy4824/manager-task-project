import { NextResponse } from "next/server"

import {
  getSession,
} from "@/lib/server-auth"

export async function GET() {
  const user = await getSession()

  /**
   * Không tồn tại User hoặc
   * User đã bị vô hiệu hóa.
   */
  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      }
    )
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    {
      status: 200,
    }
  )
}