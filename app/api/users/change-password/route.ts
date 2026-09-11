import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import {
  getSession,
  unauthorized,
} from "@/lib/server-auth"
import {
  changePasswordSchema,
} from "@/lib/validations/user"

export async function POST(req: Request) {
  try {
    /* =====================================================
       KIỂM TRA ĐĂNG NHẬP
    ===================================================== */

    const user = await getSession()

    if (!user) {
      return unauthorized()
    }

    /* =====================================================
       ĐỌC BODY
    ===================================================== */

    const body = await req.json().catch(() => ({}))

    /* =====================================================
       VALIDATION
    ===================================================== */

    const parsed =
      changePasswordSchema.safeParse(body)

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

    const {
      currentPassword,
      newPassword,
    } = parsed.data

    /* =====================================================
       LẤY USER TỪ DATABASE
    ===================================================== */

    const target = await db.user.findUnique({
      where: {
        id: user.id,
      },

      select: {
        id: true,
        password: true,
        isActive: true,
      },
    })

    if (!target) {
      return NextResponse.json(
        {
          error: "Không tìm thấy tài khoản",
        },
        {
          status: 404,
        }
      )
    }

    /* =====================================================
       KIỂM TRA TÀI KHOẢN
    ===================================================== */

    if (!target.isActive) {
      return NextResponse.json(
        {
          error:
            "Tài khoản của bạn đã bị vô hiệu hóa",
        },
        {
          status: 403,
        }
      )
    }

    /* =====================================================
       KIỂM TRA MẬT KHẨU HIỆN TẠI
    ===================================================== */

    const isCurrentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        target.password
      )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          error: "Mật khẩu hiện tại không chính xác",
        },
        {
          status: 400,
        }
      )
    }

    /* =====================================================
       HASH MẬT KHẨU MỚI
    ===================================================== */

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      )

    /* =====================================================
       CẬP NHẬT DATABASE
    ===================================================== */

    await db.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    })
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Không thể đổi mật khẩu. Vui lòng thử lại.",
      },
      {
        status: 500,
      }
    )
  }
}