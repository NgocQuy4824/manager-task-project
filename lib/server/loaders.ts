import { db } from "@/lib/db"
import type { SessionUser } from "@/lib/server-auth"
import type { TaskQueryInput } from "@/lib/validations/task"
import type { StatsData } from "@/features/dashboard/hooks/use-stats"
import type { ProjectsResponse, ProjectListItem } from "@/features/projects/types"
import type { UsersResponse, UserListItem } from "@/features/users/types"
import type { TasksResponse, TaskItem } from "@/features/tasks/types"

/**
 * Server-side data loaders dùng chung cho API route handler và SSR prefetch.
 * Trả về ĐÚNG shape JSON mà client fetch nhận được, để HydrationBoundary khớp cache.
 */

export type StatsResult = { data: StatsData } | { forbidden: true }

export async function loadStats(user: SessionUser, projectId?: string): Promise<StatsResult> {
  const isAdmin = user.role === "ADMIN"

  let allowedProjectIds: string[] | null = null
  if (!isAdmin) {
    const projects = await db.project.findMany({
      where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      select: { id: true },
    })
    allowedProjectIds = projects.map((p) => p.id)
    if (projectId && !allowedProjectIds.includes(projectId)) return { forbidden: true }
  }

  const projectFilter = projectId ? { projectId } : allowedProjectIds ? { projectId: { in: allowedProjectIds } } : {}
  const projectWhere = projectId
    ? { id: projectId }
    : allowedProjectIds
      ? { id: { in: allowedProjectIds } }
      : {}

  const [totalProjects, totalTasks, byStatusRaw, byPriorityRaw, recentTasks, projectBreakdown] = await Promise.all([
    db.project.count({ where: projectWhere as never }),
    db.task.count({ where: projectFilter as never }),
    db.task.groupBy({ by: ["status"], where: projectFilter as never, _count: true }),
    db.task.groupBy({ by: ["priority"], where: projectFilter as never, _count: true }),
    db.task.findMany({
      where: projectFilter as never,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, priority: true, updatedAt: true, project: { select: { name: true } } },
    }),
    db.task.groupBy({ by: ["projectId"], where: projectFilter as never, _count: true }),
  ])

  const projectIds = projectBreakdown.map((r) => r.projectId)
  const projectsMap = projectIds.length
    ? Object.fromEntries(
        (await db.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })).map(
          (p) => [p.id, p.name],
        ),
      )
    : {}

  return {
    data: {
      totalProjects,
      totalTasks,
      byStatus: byStatusRaw.map((r) => ({ status: r.status, count: r._count })),
      byPriority: byPriorityRaw.map((r) => ({ priority: r.priority, count: r._count })),
      byProject: projectBreakdown.map((r) => ({
        projectId: r.projectId,
        name: (projectsMap as Record<string, string>)[r.projectId] ?? r.projectId,
        count: r._count,
      })),
      recentTasks: recentTasks as unknown as StatsData["recentTasks"],
    },
  }
}

export type ProjectsListParams = { page: number; pageSize: number; search?: string }

export async function loadProjects(user: SessionUser, params: ProjectsListParams): Promise<ProjectsResponse> {
  const { page, pageSize, search } = params
  const visibleWhere =
    user.role === "ADMIN" ? {} : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] }
  const where = search ? { AND: [visibleWhere, { name: { contains: search } }] } : visibleWhere

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where: where as never,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.project.count({ where: where as never }),
  ])

  return { data: projects as unknown as ProjectListItem[], total, page, pageSize }
}

export type UsersListParams = { page: number; pageSize: number; search?: string }

export async function loadUsers(params: UsersListParams): Promise<UsersResponse> {
  const { page, pageSize, search } = params
  const where = search
    ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
    : undefined

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, createdAt: true, image: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ])

  return { data: users as unknown as UserListItem[], total, page, pageSize }
}

export type TasksResult = TasksResponse | { forbidden: true }

export async function loadTasks(user: SessionUser, q: TaskQueryInput): Promise<TasksResult> {
  const where: Record<string, unknown> = {}
  if (q.projectId) where.projectId = q.projectId
  if (q.status) where.status = q.status
  if (q.priority) where.priority = q.priority
  if (q.assigneeId) where.assigneeId = q.assigneeId
  if (q.executorId) where.executorId = q.executorId
  if (q.creatorId) where.creatorId = q.creatorId
  if (q.isDraft !== undefined) where.isDraft = q.isDraft
  if (q.pendingApproval !== undefined) where.pendingApproval = q.pendingApproval
  if (q.search) where.title = { contains: q.search }

  let allowedProjectIds: string[] | null = null
  if (user.role !== "ADMIN") {
    const projects = await db.project.findMany({
      where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      select: { id: true },
    })
    allowedProjectIds = projects.map((p) => p.id)
    if (q.projectId && !allowedProjectIds.includes(q.projectId)) return { forbidden: true }
    if (allowedProjectIds.length === 0) return { data: [], total: 0, page: q.page, pageSize: q.pageSize }
    if (!q.projectId) where.projectId = { in: allowedProjectIds }
  }

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where: where as never,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        executor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    db.task.count({ where: where as never }),
  ])

  return { data: tasks as unknown as TaskItem[], total, page: q.page, pageSize: q.pageSize }
}
