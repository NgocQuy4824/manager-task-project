import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import {
  getSession,
  unauthorized,
  forbidden,
} from "@/lib/server-auth"
import { updateUserSchema } from "@/lib/validations/user"

type Context = {
  params: {
    id: string
  }
}

/* =========================================================
   GET USER
========================================================= */

export async function GET(
  _req: Request,
  { params }: Context
) {
  const user = await getSession()

  if (!user) {
    return unauthorized()
  }

  const target = await db.user.findUnique({
    where: {
      id: params.id,
    },

    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!target) {
    return NextResponse.json(
      {
        error: "Không tìm thấy người dùng",
      },
      {
        status: 404,
      }
    )
  }

  return NextResponse.json({
    data: target,
  })
}

/* =========================================================
   PATCH USER
========================================================= */

export async function PATCH(
  req: Request,
  { params }: Context
) {
  const user = await getSession()

  if (!user) {
    return unauthorized()
  }

  if (user.role !== "ADMIN") {
    return forbidden(
      "Chỉ Admin được chỉnh sửa người dùng"
    )
  }

  const target = await db.user.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!target) {
    return NextResponse.json(
      {
        error: "Không tìm thấy người dùng",
      },
      {
        status: 404,
      }
    )
  }

  const body = await req.json().catch(() => ({}))

  const parsed =
    updateUserSchema.safeParse(body)

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

  /* =====================================================
     KHÔNG CHO ADMIN TỰ VÔ HIỆU HÓA
  ===================================================== */

  if (
    params.id === user.id &&
    parsed.data.isActive === false
  ) {
    return NextResponse.json(
      {
        error:
          "Bạn không thể vô hiệu hóa chính tài khoản của mình",
      },
      {
        status: 400,
      }
    )
  }

  /* =====================================================
     KHÔNG CHO ADMIN TỰ HẠ QUYỀN
  ===================================================== */

  if (
    params.id === user.id &&
    parsed.data.role &&
    parsed.data.role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        error:
          "Bạn không thể tự hạ quyền tài khoản Admin của mình",
      },
      {
        status: 400,
      }
    )
  }

  /* =====================================================
     KHÔNG CHO HẠ QUYỀN ADMIN CUỐI CÙNG
  ===================================================== */

  if (
    target.role === "ADMIN" &&
    parsed.data.role &&
    parsed.data.role !== "ADMIN"
  ) {
    const adminCount =
      await db.user.count({
        where: {
          role: "ADMIN",
        },
      })

    if (adminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "Không thể hạ quyền Admin cuối cùng của hệ thống",
        },
        {
          status: 400,
        }
      )
    }
  }

  /* =====================================================
     KHÔNG CHO VÔ HIỆU HÓA ADMIN CUỐI CÙNG
  ===================================================== */

  if (
    target.role === "ADMIN" &&
    parsed.data.isActive === false &&
    target.isActive === true
  ) {
    const activeAdminCount =
      await db.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      })

    if (activeAdminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "Không thể vô hiệu hóa Admin đang hoạt động cuối cùng",
        },
        {
          status: 400,
        }
      )
    }
  }

  /* =====================================================
     CHUẨN BỊ DATA UPDATE
  ===================================================== */

  const data: {
    email?: string
    name?: string | null
    role?: "ADMIN" | "MANAGER" | "MEMBER"
    isActive?: boolean
    password?: string
  } = {}

  if (
    parsed.data.email !== undefined
  ) {
    const email =
      parsed.data.email.toLowerCase()

    const exists =
      await db.user.findFirst({
        where: {
          email,

          NOT: {
            id: params.id,
          },
        },
      })

    if (exists) {
      return NextResponse.json(
        {
          error:
            "Email đã được sử dụng bởi tài khoản khác",
        },
        {
          status: 400,
        }
      )
    }

    data.email = email
  }

  if (
    parsed.data.name !== undefined
  ) {
    data.name =
      parsed.data.name || null
  }

  if (
    parsed.data.role !== undefined
  ) {
    data.role =
      parsed.data.role
  }

  if (
    parsed.data.isActive !== undefined
  ) {
    data.isActive =
      parsed.data.isActive
  }

  if (parsed.data.password) {
    data.password =
      await bcrypt.hash(
        parsed.data.password,
        10
      )
  }

  /* =====================================================
     UPDATE
  ===================================================== */

  try {
    const updated =
      await db.user.update({
        where: {
          id: params.id,
        },

        data,

        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    return NextResponse.json({
      data: updated,
    })
  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Không thể cập nhật người dùng",
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   DELETE USER
========================================================= */

export async function DELETE(
  _req: Request,
  { params }: Context
) {
  const user = await getSession()

  /* -------------------------
     CHƯA ĐĂNG NHẬP
  ------------------------- */

  if (!user) {
    return unauthorized()
  }

  /* -------------------------
     CHỈ ADMIN
  ------------------------- */

  if (user.role !== "ADMIN") {
    return forbidden(
      "Chỉ Admin được xóa người dùng"
    )
  }

  /* -------------------------
     KHÔNG TỰ XÓA
  ------------------------- */

  if (user.id === params.id) {
    return NextResponse.json(
      {
        error:
          "Bạn không thể tự xóa tài khoản của mình",
      },
      {
        status: 400,
      }
    )
  }

  /* -------------------------
     TÌM USER
  ------------------------- */

  const target =
    await db.user.findUnique({
      where: {
        id: params.id,
      },
    })

  if (!target) {
    return NextResponse.json(
      {
        error:
          "Không tìm thấy người dùng",
      },
      {
        status: 404,
      }
    )
  }

  /* =====================================================
     KHÔNG CHO XÓA ADMIN CUỐI CÙNG
  ===================================================== */

  if (target.role === "ADMIN") {
    const adminCount =
      await db.user.count({
        where: {
          role: "ADMIN",
        },
      })

    if (adminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "Không thể xóa Admin cuối cùng của hệ thống",
        },
        {
          status: 400,
        }
      )
    }
  }

  /* =====================================================
     KIỂM TRA DỮ LIỆU LIÊN QUAN
  ===================================================== */

  const [
    ownedProjects,
    projectMembers,
    createdTasks,
    assignedTasks,
    executedTasks,
    transitions,
  ] = await Promise.all([
    db.project.count({
      where: {
        ownerId: params.id,
      },
    }),

    db.projectMember.count({
      where: {
        userId: params.id,
      },
    }),

    db.task.count({
      where: {
        creatorId: params.id,
      },
    }),

    db.task.count({
      where: {
        assigneeId: params.id,
      },
    }),

    db.task.count({
      where: {
        executorId: params.id,
      },
    }),

    db.taskTransition.count({
      where: {
        actorId: params.id,
      },
    }),
  ])

  /* =====================================================
     NẾU CÒN DỮ LIỆU LIÊN QUAN
     → KHÔNG XÓA ĐỂ TRÁNH MẤT DỮ LIỆU
  ===================================================== */

  const hasRelatedData =
    ownedProjects > 0 ||
    projectMembers > 0 ||
    createdTasks > 0 ||
    assignedTasks > 0 ||
    executedTasks > 0 ||
    transitions > 0

  if (hasRelatedData) {
    const details: string[] = []

    if (ownedProjects > 0) {
      details.push(
        `${ownedProjects} dự án sở hữu`
      )
    }

    if (projectMembers > 0) {
      details.push(
        `${projectMembers} thành viên dự án`
      )
    }

    if (createdTasks > 0) {
      details.push(
        `${createdTasks} task đã tạo`
      )
    }

    if (assignedTasks > 0) {
      details.push(
        `${assignedTasks} task được giao`
      )
    }

    if (executedTasks > 0) {
      details.push(
        `${executedTasks} task thực thi`
      )
    }

    if (transitions > 0) {
      details.push(
        `${transitions} lịch sử chuyển trạng thái`
      )
    }

    return NextResponse.json(
      {
        error:
          "Không thể xóa người dùng vì tài khoản đang có dữ liệu liên quan",
        details,
        suggestion:
          "Hãy vô hiệu hóa tài khoản thay vì xóa để giữ nguyên dữ liệu hệ thống.",
      },
      {
        status: 400,
      }
    )
  }

  /* =====================================================
     XÓA USER
  ===================================================== */

  try {
    await db.user.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      "DELETE USER ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Không thể xóa người dùng. Tài khoản có thể đang được dữ liệu khác sử dụng.",
      },
      {
        status: 500,
      }
    )
  }
}