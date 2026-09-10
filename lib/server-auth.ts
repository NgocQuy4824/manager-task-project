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

/**
 * Lấy session server-side.
 *
 * Ngoài việc kiểm tra NextAuth session,
 * hàm này kiểm tra trực tiếp User trong MongoDB.
 *
 * Nếu User:
 * - không còn tồn tại
 * - hoặc isActive = false
 *
 * thì trả về null.
 *
 * Điều này giúp tài khoản bị xóa / vô hiệu hóa
 * không thể tiếp tục gọi API được.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  })

  /**
   * User đã bị xóa khỏi MongoDB
   */
  if (!user) {
    return null
  }

  /**
   * User bị Admin vô hiệu hóa
   */
  if (!user.isActive) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

export function unauthorized() {
  return NextResponse.json(
    {
      error: "Chưa đăng nhập",
    },
    {
      status: 401,
    }
  )
}

export function forbidden(
  msg = "Không có quyền thực hiện"
) {
  return NextResponse.json(
    {
      error: msg,
    },
    {
      status: 403,
    }
  )
}

export function badRequest(
  msg: string
) {
  return NextResponse.json(
    {
      error: msg,
    },
    {
      status: 400,
    }
  )
}

export function notFound(
  msg = "Không tìm thấy"
) {
  return NextResponse.json(
    {
      error: msg,
    },
    {
      status: 404,
    }
  )
}

export function conflict(
  msg: string
) {
  return NextResponse.json(
    {
      error: msg,
    },
    {
      status: 409,
    }
  )
}

/**
 * Kiểm tra user có quyền truy cập project không
 * (owner / member / ADMIN).
 */
export async function canAccessProject(
  user: SessionUser,
  projectId: string
): Promise<boolean> {
  if (user.role === "ADMIN") {
    return true
  }

  const [
    project,
    member,
  ] = await Promise.all([
    db.project.findUnique({
      where: {
        id: projectId,
      },

      select: {
        ownerId: true,
      },
    }),

    db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },

      select: {
        id: true,
      },
    }),
  ])

  if (!project) {
    return false
  }

  return (
    project.ownerId === user.id ||
    !!member
  )
}