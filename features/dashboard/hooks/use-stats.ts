import { keepPreviousData, useQuery } from "@tanstack/react-query"

export type StatsData = {
  totalProjects: number
  totalTasks: number
  byStatus: { status: string; count: number }[]
  byPriority: { priority: string; count: number }[]
  byProject: { projectId: string; name: string; count: number }[]
  recentTasks: { id: string; title: string; status: string; priority: string; updatedAt: string; project: { name: string } | null }[]
}

async function fetchStats(projectId?: string): Promise<{ data: StatsData }> {
  const qs = projectId ? `?projectId=${projectId}` : ""
  const res = await fetch(`/api/stats${qs}`, { credentials: "include" })
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Lỗi tải thống kê")
  return res.json()
}

export function useStats(projectId?: string) {
  return useQuery({ queryKey: ["stats", projectId ?? ""], queryFn: () => fetchStats(projectId), placeholderData: keepPreviousData })
}
