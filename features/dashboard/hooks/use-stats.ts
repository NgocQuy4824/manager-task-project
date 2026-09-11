import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query"

export type StatsData = {
  totalProjects: number
  totalTasks: number

  pendingApproval: number
  todo: number
  inProgress: number
  pendingAcceptance: number
  done: number
  rejected: number

  overdueTasks: number
  upcomingTasks: number
  completionRate: number

  byStatus: {
    status: string
    count: number
  }[]

  byPriority: {
    priority: string
    count: number
  }[]

  byProject: {
    projectId: string
    name: string
    count: number
  }[]

  recentTasks: {
    id: string
    title: string
    status: string
    priority: string
    dueDate: string | null
    updatedAt: string
    project: {
      name: string
    } | null
  }[]

  upcomingTaskList: {
    id: string
    title: string
    status: string
    priority: string
    dueDate: string
    project: {
      name: string
    } | null
  }[]

  recentActivities: {
    id: string
    taskId: string
    taskTitle: string
    from: string | null
    to: string
    reason: string | null
    createdAt: string
    actor: {
      name: string | null
      email: string
    } | null
  }[]
}

type StatsResponse = {
  data: StatsData
}

async function fetchStats(
  projectId?: string
): Promise<StatsResponse> {
  const params = new URLSearchParams()

  if (projectId) {
    params.set("projectId", projectId)
  }

  const queryString = params.toString()

  const url = queryString
    ? `/api/stats?${queryString}`
    : "/api/stats"

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({}))

    throw new Error(
      body?.error ??
        "Không thể tải thống kê"
    )
  }

  return response.json()
}

export function useStats(
  projectId?: string
) {
  return useQuery({
    queryKey: [
      "stats",
      projectId ?? "",
    ],

    queryFn: () =>
      fetchStats(projectId),

    placeholderData:
      keepPreviousData,

    staleTime: 30_000,
  })
}