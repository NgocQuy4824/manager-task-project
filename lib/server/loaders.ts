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

/**
 * Server-side data loaders dùng chung cho API route handler và SSR prefetch.
 * Trả về đúng shape JSON mà client fetch nhận được,
 * để HydrationBoundary khớp cache.
 */

/* =========================================================
   DASHBOARD
========================================================= */

export type StatsResult =
  | { data: StatsData }
  | { forbidden: true }

export async function loadStats(
  user: SessionUser,
  projectId?: string
): Promise<StatsResult> {
  const isAdmin = user.role === "ADMIN"

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

    if (
      projectId &&
      !allowedProjectIds.includes(projectId)
    ) {
      return {
        forbidden: true,
      }
    }
  }

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

  const [
    totalProjects,
    totalTasks,
    byStatusRaw,
    byPriorityRaw,
    recentTasks,
    projectBreakdown,
  ] = await Promise.all([
    db.project.count({
      where: projectWhere as never,
    }),

    db.task.count({
      where: projectFilter as never,
    }),

    db.task.groupBy({
      by: ["status"],
      where: projectFilter as never,
      _count: true,
    }),

    db.task.groupBy({
      by: ["priority"],
      where: projectFilter as never,
      _count: true,
    }),

    db.task.findMany({
      where: projectFilter as never,

      orderBy: {
        updatedAt: "desc",
      },

      take: 5,

      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,

        project: {
          select: {
            name: true,
          },
        },
      },
    }),

    db.task.groupBy({
      by: ["projectId"],
      where: projectFilter as never,
      _count: true,
    }),
  ])

  const projectIds = projectBreakdown.map(
    (item) => item.projectId
  )

  const projectsMap = projectIds.length
    ? Object.fromEntries(
        (
          await db.project.findMany({
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
        ).map((project) => [
          project.id,
          project.name,
        ])
      )
    : {}

  return {
    data: {
      totalProjects,
      totalTasks,

      byStatus: byStatusRaw.map(
        (item) => ({
          status: item.status,
          count: item._count,
        })
      ),

      byPriority: byPriorityRaw.map(
        (item) => ({
          priority: item.priority,
          count: item._count,
        })
      ),

      byProject: projectBreakdown.map(
        (item) => ({
          projectId: item.projectId,

          name:
            (
              projectsMap as Record<
                string,
                string
              >
            )[item.projectId] ??
            item.projectId,

          count: item._count,
        })
      ),

      recentTasks:
        recentTasks as unknown as StatsData["recentTasks"],
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
   * Vì owner là relation bắt buộc trong Prisma:
   *
   * owner User @relation(...)
   *
   * Nếu MongoDB có project trỏ tới user đã bị xóa,
   * Prisma sẽ báo:
   *
   * Inconsistent query result:
   * Field owner is required to return data, got null
   */

  const ownerIds = Array.from(
    new Set(
      projects.map(
        (project) => project.ownerId
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

  const ownerMap = new Map(
    owners.map((owner) => [
      owner.id,
      owner,
    ])
  )

  const data = projects.map(
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
  status?: "ALL" | "ACTIVE" | "INACTIVE"
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
     * User không có quyền truy cập project
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
     * Không có project nào
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
     * → chỉ lấy các project user được phép xem
     */

    if (!q.projectId) {
      where.projectId = {
        in: allowedProjectIds,
      }
    }
  }

  /* =====================================================
     LẤY TASK

     QUAN TRỌNG:
     KHÔNG include creator / assignee / executor / project
     
     Vì các relation này có thể bị mồ côi trong MongoDB.
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

     Bao gồm:
     - creatorId
     - assigneeId
     - executorId
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

     Chỉ những User thực sự tồn tại
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

     Nếu User hoặc Project đã bị xóa:
     
     creator  = null
     assignee = null
     executor = null
     project  = null

     → Không làm Prisma crash.
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