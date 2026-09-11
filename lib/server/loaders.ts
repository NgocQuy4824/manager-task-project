import { db } from "@/lib/db"
import type { SessionUser } from "@/lib/server-auth"
import type { TaskQueryInput } from "@/lib/validations/task"
import type { StatsData } from "@/features/dashboard/hooks/use-stats"
import type {
  ProjectsResponse,
  ProjectListItem,
} from "@/features/projects/types"
import type {
  UsersResponse,
  UserListItem,
} from "@/features/users/types"
import type {
  TasksResponse,
  TaskItem,
} from "@/features/tasks/types"


export type StatsResult =
  | { data: StatsData }
  | { forbidden: true }

export async function loadStats(
  user: SessionUser,
  projectId?: string
): Promise<StatsResult> {
  const isAdmin = user.role === "ADMIN"

  /*
   * ========================================================
   * 1. PROJECT USER ĐƯỢC PHÉP XEM
   * ========================================================
   */

  let allowedProjectIds: string[] | null = null

  if (!isAdmin) {
    const projects = await db.project.findMany({
      where: {
        OR: [
          {
            ownerId: user.id,
          },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },

      select: {
        id: true,
      },
    })

    allowedProjectIds = projects.map(
      (project) => project.id
    )

    /*
     * User chọn project nhưng không có quyền
     */
    if (
      projectId &&
      !allowedProjectIds.includes(projectId)
    ) {
      return {
        forbidden: true,
      }
    }
  }

  /*
   * ========================================================
   * 2. FILTER
   * ========================================================
   */

  const projectFilter = projectId
    ? {
        projectId,
      }
    : allowedProjectIds
      ? {
          projectId: {
            in: allowedProjectIds,
          },
        }
      : {}

  const projectWhere = projectId
    ? {
        id: projectId,
      }
    : allowedProjectIds
      ? {
          id: {
            in: allowedProjectIds,
          },
        }
      : {}

  const now = new Date()

  const next7Days = new Date(now)

  next7Days.setDate(
    next7Days.getDate() + 7
  )

  /*
   * ========================================================
   * 3. QUERY DASHBOARD
   * ========================================================
   */

  const [
    totalProjects,
    totalTasks,

    pendingApproval,
    todo,
    inProgress,
    pendingAcceptance,
    done,
    rejected,

    overdueTasks,
    upcomingTasks,

    byStatusRaw,
    byPriorityRaw,
    projectBreakdown,

    recentTasksRaw,
    upcomingTasksRaw,

    transitionsRaw,
  ] = await Promise.all([
    /*
     * Tổng project
     */
    db.project.count({
      where: projectWhere as never,
    }),

    /*
     * Tổng task
     */
    db.task.count({
      where: projectFilter as never,
    }),

    /*
     * ---------------------------------------------
     * STATUS
     * ---------------------------------------------
     */

    db.task.count({
      where: {
        ...(projectFilter as object),
        status: "PENDING_APPROVAL",
      } as never,
    }),

    db.task.count({
      where: {
        ...(projectFilter as object),
        status: "TODO",
      } as never,
    }),

    db.task.count({
      where: {
        ...(projectFilter as object),
        status: "IN_PROGRESS",
      } as never,
    }),

    db.task.count({
      where: {
        ...(projectFilter as object),
        status: "PENDING_ACCEPTANCE",
      } as never,
    }),

    db.task.count({
      where: {
        ...(projectFilter as object),
        status: "DONE",
      } as never,
    }),

    db.task.count({
      where: {
        ...(projectFilter as object),
        status: "REJECTED",
      } as never,
    }),

    /*
     * ---------------------------------------------
     * TASK QUÁ HẠN
     * ---------------------------------------------
     */

    db.task.count({
      where: {
        ...(projectFilter as object),

        dueDate: {
          lt: now,
        },

        status: {
          notIn: [
            "DONE",
            "REJECTED",
          ],
        },
      } as never,
    }),

    /*
     * ---------------------------------------------
     * TASK SẮP ĐẾN HẠN
     * 7 ngày tiếp theo
     * ---------------------------------------------
     */

    db.task.count({
      where: {
        ...(projectFilter as object),

        dueDate: {
          gte: now,
          lte: next7Days,
        },

        status: {
          notIn: [
            "DONE",
            "REJECTED",
          ],
        },
      } as never,
    }),

    /*
     * ---------------------------------------------
     * GROUP STATUS
     * ---------------------------------------------
     */

    db.task.groupBy({
      by: ["status"],

      where:
        projectFilter as never,

      _count: true,
    }),

    /*
     * ---------------------------------------------
     * GROUP PRIORITY
     * ---------------------------------------------
     */

    db.task.groupBy({
      by: ["priority"],

      where:
        projectFilter as never,

      _count: true,
    }),

    /*
     * ---------------------------------------------
     * GROUP PROJECT
     * ---------------------------------------------
     */

    db.task.groupBy({
      by: ["projectId"],

      where:
        projectFilter as never,

      _count: true,
    }),

    /*
     * ---------------------------------------------
     * 5 TASK CẬP NHẬT GẦN NHẤT
     * ---------------------------------------------
     *
     * Không include project để tránh lỗi
     * relation mồ côi trong MongoDB.
     */

    db.task.findMany({
      where:
        projectFilter as never,

      orderBy: {
        updatedAt: "desc",
      },

      take: 5,

      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        updatedAt: true,
        projectId: true,
      },
    }),

    /*
     * ---------------------------------------------
     * 5 TASK SẮP ĐẾN HẠN
     * ---------------------------------------------
     */

    db.task.findMany({
      where: {
        ...(projectFilter as object),

        dueDate: {
          gte: now,
          lte: next7Days,
        },

        status: {
          notIn: [
            "DONE",
            "REJECTED",
          ],
        },
      } as never,

      orderBy: {
        dueDate: "asc",
      },

      take: 5,

      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
      },
    }),

    /*
     * ---------------------------------------------
     * 8 HOẠT ĐỘNG GẦN NHẤT
     * ---------------------------------------------
     */

    db.taskTransition.findMany({
      where: {
        task: projectFilter as never,
      } as never,

      orderBy: {
        createdAt: "desc",
      },

      take: 8,

      select: {
        id: true,
        taskId: true,
        from: true,
        to: true,
        reason: true,
        actorId: true,
        createdAt: true,
      },
    }),
  ])

  /*
   * ========================================================
   * 4. LẤY PROJECT NAME
   * ========================================================
   */

  const projectIds = Array.from(
    new Set([
      ...projectBreakdown.map(
        (item) => item.projectId
      ),

      ...recentTasksRaw.map(
        (item) => item.projectId
      ),

      ...upcomingTasksRaw.map(
        (item) => item.projectId
      ),
    ])
  )

  const projects =
    projectIds.length > 0
      ? await db.project.findMany({
          where: {
            id: {
              in: projectIds,
            },
          },

          select: {
            id: true,
            name: true,
          },
        })
      : []

  const projectMap =
    new Map(
      projects.map(
        (project) => [
          project.id,
          project.name,
        ]
      )
    )

  /*
   * ========================================================
   * 5. LẤY TASK + USER CHO ACTIVITY
   * ========================================================
   */

  const transitionTaskIds =
    Array.from(
      new Set(
        transitionsRaw.map(
          (transition) =>
            transition.taskId
        )
      )
    )

  const actorIds =
    Array.from(
      new Set(
        transitionsRaw.map(
          (transition) =>
            transition.actorId
        )
      )
    )

  const [
    transitionTasks,
    actors,
  ] = await Promise.all([
    /*
     * Task của transition
     */
    transitionTaskIds.length > 0
      ? db.task.findMany({
          where: {
            id: {
              in: transitionTaskIds,
            },
          },

          select: {
            id: true,
            title: true,
          },
        })
      : [],

    /*
     * User thực hiện transition
     */
    actorIds.length > 0
      ? db.user.findMany({
          where: {
            id: {
              in: actorIds,
            },
          },

          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [],
  ])

  const taskMap =
    new Map(
      transitionTasks.map(
        (task) => [
          task.id,
          task.title,
        ]
      )
    )

  const actorMap =
    new Map(
      actors.map(
        (actor) => [
          actor.id,
          {
            name: actor.name,
            email: actor.email,
          },
        ]
      )
    )

  /*
   * ========================================================
   * 6. STATUS DATA
   * ========================================================
   */

  const byStatus =
    byStatusRaw.map(
      (item) => ({
        status: String(
          item.status
        ),

        count: item._count,
      })
    )

  /*
   * ========================================================
   * 7. PRIORITY DATA
   * ========================================================
   */

  const byPriority =
    byPriorityRaw.map(
      (item) => ({
        priority: String(
          item.priority
        ),

        count: item._count,
      })
    )

  /*
   * ========================================================
   * 8. PROJECT DATA
   * ========================================================
   */

  const byProject =
    projectBreakdown.map(
      (item) => ({
        projectId:
          item.projectId,

        name:
          projectMap.get(
            item.projectId
          ) ??
          "Project không tồn tại",

        count:
          item._count,
      })
    )

  /*
   * ========================================================
   * 9. RECENT TASKS
   * ========================================================
   */

  const recentTasks =
    recentTasksRaw.map(
      (task) => ({
        id: task.id,

        title: task.title,

        status: String(
          task.status
        ),

        priority: String(
          task.priority
        ),

        dueDate:
          task.dueDate
            ? task.dueDate.toISOString()
            : null,

        updatedAt:
          task.updatedAt.toISOString(),

        project:
          projectMap.has(
            task.projectId
          )
            ? {
                name:
                  projectMap.get(
                    task.projectId
                  ) ??
                  "Project",
              }
            : null,
      })
    )

  /*
   * ========================================================
   * 10. UPCOMING TASKS
   * ========================================================
   */

  const upcomingTaskList =
    upcomingTasksRaw
      .filter(
        (task) =>
          task.dueDate !== null
      )
      .map(
        (task) => ({
          id: task.id,

          title: task.title,

          status: String(
            task.status
          ),

          priority: String(
            task.priority
          ),

          dueDate:
            task.dueDate!.toISOString(),

          project:
            projectMap.has(
              task.projectId
            )
              ? {
                  name:
                    projectMap.get(
                      task.projectId
                    ) ??
                    "Project",
                }
              : null,
        })
      )

  /*
   * ========================================================
   * 11. RECENT ACTIVITIES
   * ========================================================
   */

  const recentActivities =
    transitionsRaw.map(
      (transition) => ({
        id: transition.id,

        taskId:
          transition.taskId,

        taskTitle:
          taskMap.get(
            transition.taskId
          ) ??
          "Task không tồn tại",

        from:
          transition.from
            ? String(
                transition.from
              )
            : null,

        to: String(
          transition.to
        ),

        reason:
          transition.reason,

        createdAt:
          transition.createdAt.toISOString(),

        actor:
          actorMap.get(
            transition.actorId
          ) ?? null,
      })
    )

  /*
   * ========================================================
   * 12. TỶ LỆ HOÀN THÀNH
   * ========================================================
   */

  const completionRate =
    totalTasks > 0
      ? Math.round(
          (done / totalTasks) *
            100
        )
      : 0

  /*
   * ========================================================
   * 13. RETURN
   * ========================================================
   */

  return {
    data: {
      totalProjects,
      totalTasks,

      pendingApproval,
      todo,
      inProgress,
      pendingAcceptance,
      done,
      rejected,

      overdueTasks,
      upcomingTasks,
      completionRate,

      byStatus,
      byPriority,
      byProject,

      recentTasks,

      upcomingTaskList,

      recentActivities,
    },
  }
}

/* =========================================================
   PROJECTS
========================================================= */

export type ProjectsListParams = {
  page: number
  pageSize: number
  search?: string
}

export async function loadProjects(
  user: SessionUser,
  params: ProjectsListParams
): Promise<ProjectsResponse> {
  const {
    page,
    pageSize,
    search,
  } = params

  const visibleWhere =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [
            {
              ownerId: user.id,
            },

            {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          ],
        }

  const where = search
    ? {
        AND: [
          visibleWhere,

          {
            name: {
              contains: search,
            },
          },
        ],
      }
    : visibleWhere

  const [
    projects,
    total,
  ] = await Promise.all([
    db.project.findMany({
      where: where as never,

      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,

        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip:
        (page - 1) *
        pageSize,

      take: pageSize,
    }),

    db.project.count({
      where: where as never,
    }),
  ])

  /*
   * Không include owner trực tiếp.
   *
   * MongoDB có thể có project trỏ tới
   * User đã bị xóa.
   */

  const ownerIds =
    Array.from(
      new Set(
        projects.map(
          (project) =>
            project.ownerId
        )
      )
    )

  const owners =
    ownerIds.length > 0
      ? await db.user.findMany({
          where: {
            id: {
              in: ownerIds,
            },
          },

          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : []

  const ownerMap =
    new Map(
      owners.map(
        (owner) => [
          owner.id,
          owner,
        ]
      )
    )

  const data =
    projects.map(
      (project) => ({
        ...project,

        owner:
          ownerMap.get(
            project.ownerId
          ) ?? null,
      })
    )

  return {
    data:
      data as unknown as ProjectListItem[],

    total,

    page,

    pageSize,
  }
}

/* =========================================================
   USERS
========================================================= */

export type UsersListParams = {
  page: number
  pageSize: number
  search?: string
  status?:
    | "ALL"
    | "ACTIVE"
    | "INACTIVE"
}

export async function loadUsers({
  page = 1,
  pageSize = 20,
  search,
  status,
}: UsersListParams): Promise<UsersResponse> {
  const where: any = {}

  if (search) {
    where.OR = [
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    ]
  }

  if (status === "ACTIVE") {
    where.isActive = true
  }

  if (status === "INACTIVE") {
    where.isActive = false
  }

  const skip =
    (page - 1) *
    pageSize

  const [
    data,
    total,
  ] = await Promise.all([
    db.user.findMany({
      where,

      skip,

      take: pageSize,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        image: true,
      },
    }),

    db.user.count({
      where,
    }),
  ])

  return {
    data:
      data as unknown as UserListItem[],

    total,

    page,

    pageSize,
  }
}

/* =========================================================
   TASKS
========================================================= */

export type TasksResult =
  | TasksResponse
  | { forbidden: true }

export async function loadTasks(
  user: SessionUser,
  q: TaskQueryInput
): Promise<TasksResult> {
  const where: Record<
    string,
    unknown
  > = {}

  /* -------------------------
     FILTER
  ------------------------- */

  if (q.projectId) {
    where.projectId =
      q.projectId
  }

  if (q.status) {
    where.status =
      q.status
  }

  if (q.priority) {
    where.priority =
      q.priority
  }

  if (q.assigneeId) {
    where.assigneeId =
      q.assigneeId
  }

  if (q.executorId) {
    where.executorId =
      q.executorId
  }

  if (q.creatorId) {
    where.creatorId =
      q.creatorId
  }

  if (
    q.isDraft !== undefined
  ) {
    where.isDraft =
      q.isDraft
  }

  if (
    q.pendingApproval !==
    undefined
  ) {
    where.pendingApproval =
      q.pendingApproval
  }

  if (q.search) {
    where.title = {
      contains: q.search,
    }
  }

  /* -------------------------
     PROJECT PERMISSION
  ------------------------- */

  let allowedProjectIds:
    | string[]
    | null = null

  if (user.role !== "ADMIN") {
    const projects =
      await db.project.findMany({
        where: {
          OR: [
            {
              ownerId:
                user.id,
            },

            {
              members: {
                some: {
                  userId:
                    user.id,
                },
              },
            },
          ],
        },

        select: {
          id: true,
        },
      })

    allowedProjectIds =
      projects.map(
        (project) =>
          project.id
      )

    /*
     * User không có quyền
     * với project được yêu cầu.
     */

    if (
      q.projectId &&
      !allowedProjectIds.includes(
        q.projectId
      )
    ) {
      return {
        forbidden: true,
      }
    }

    /*
     * Không có project nào.
     */

    if (
      allowedProjectIds.length ===
      0
    ) {
      return {
        data: [],

        total: 0,

        page: q.page,

        pageSize:
          q.pageSize,
      }
    }

    /*
     * Không truyền projectId
     *
     * → chỉ lấy project user được xem.
     */

    if (!q.projectId) {
      where.projectId = {
        in: allowedProjectIds,
      }
    }
  }

  /* =====================================================
     LẤY TASK

     KHÔNG include creator / assignee /
     executor / project.

     Tránh lỗi relation mồ côi MongoDB.
  ===================================================== */

  const [
    tasks,
    total,
  ] = await Promise.all([
    db.task.findMany({
      where: where as never,

      orderBy: {
        updatedAt: "desc",
      },

      skip:
        (q.page - 1) *
        q.pageSize,

      take: q.pageSize,
    }),

    db.task.count({
      where: where as never,
    }),
  ])

  /* =====================================================
     LẤY USER ID
  ===================================================== */

  const userIds =
    Array.from(
      new Set(
        tasks.flatMap(
          (task) =>
            [
              task.creatorId,
              task.assigneeId,
              task.executorId,
            ].filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        )
      )
    )

  /* =====================================================
     LẤY USER
  ===================================================== */

  const users =
    userIds.length > 0
      ? await db.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },

          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        })
      : []

  const userMap =
    new Map(
      users.map(
        (item) => [
          item.id,
          item,
        ]
      )
    )

  /* =====================================================
     LẤY PROJECT
  ===================================================== */

  const projectIds =
    Array.from(
      new Set(
        tasks.map(
          (task) =>
            task.projectId
        )
      )
    )

  const projects =
    projectIds.length > 0
      ? await db.project.findMany({
          where: {
            id: {
              in: projectIds,
            },
          },

          select: {
            id: true,
            name: true,
          },
        })
      : []

  const projectMap =
    new Map(
      projects.map(
        (project) => [
          project.id,
          project,
        ]
      )
    )

  /* =====================================================
     GHÉP DỮ LIỆU
  ===================================================== */

  const data =
    tasks.map(
      (task) => ({
        ...task,

        creator:
          userMap.get(
            task.creatorId
          ) ?? null,

        assignee:
          task.assigneeId
            ? userMap.get(
                task.assigneeId
              ) ?? null
            : null,

        executor:
          task.executorId
            ? userMap.get(
                task.executorId
              ) ?? null
            : null,

        project:
          projectMap.get(
            task.projectId
          ) ?? null,
      })
    )

  return {
    data:
      data as unknown as TaskItem[],

    total,

    page:
      q.page,

    pageSize:
      q.pageSize,
  }
}