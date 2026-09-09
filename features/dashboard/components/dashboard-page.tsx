"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { FolderKanban, ListChecks, Clock, CircleCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useStats } from "@/features/dashboard/hooks/use-stats"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { TASK_STATUS_LABELS } from "@/lib/constants"
import type { TaskStatusType } from "@/lib/constants"

const ChartsPanel = dynamic(
  () => import("./charts-panel").then((m) => m.ChartsPanel),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> },
)

export function DashboardPageContent() {
  const [projectId, setProjectId] = useState<string>("")
  const { data, isLoading, error } = useStats(projectId || undefined)
  const projectsQ = useProjects({ pageSize: 50 })

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
  }
  if (error) return <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{(error as Error).message}</p>

  const s = data!.data
  const statusData = s.byStatus.map((r) => ({ name: (TASK_STATUS_LABELS as Record<string, string>)[r.status] ?? r.status, value: r.count, key: r.status }))
  const projectData = s.byProject.map((r) => ({ name: r.name, tasks: r.count }))

  const stats = [
    { label: "Tổng projects", value: s.totalProjects, icon: FolderKanban, tile: "bg-primary/10 text-primary" },
    { label: "Tổng tasks", value: s.totalTasks, icon: ListChecks, tile: "bg-blue-500/10 text-blue-600" },
    { label: "Chờ duyệt", value: s.byStatus.find((x) => x.status === "PENDING_APPROVAL")?.count ?? 0, icon: Clock, tile: "bg-amber-500/10 text-amber-600" },
    { label: "Hoàn thành", value: s.byStatus.find((x) => x.status === "DONE")?.count ?? 0, icon: CircleCheck, tile: "bg-emerald-500/10 text-emerald-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Bức tranh tổng thể về tiến độ công việc của bạn.</p>
        </div>
        <Select value={projectId || "__all__"} onValueChange={(v) => setProjectId(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Tất cả projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả projects</SelectItem>
            {(projectsQ.data?.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-fade-in-up border shadow-soft transition-colors hover:border-primary/30">
            <CardContent className="flex items-center gap-4 pt-6">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.tile}`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChartsPanel statusData={statusData} projectData={projectData} />

      <Card className="border shadow-soft">
        <CardHeader><CardTitle className="text-base font-semibold">Hoạt động gần đây</CardTitle></CardHeader>
        <CardContent>
          {s.recentTasks.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có task nào.</p> : (
            <div className="space-y-2">
              {s.recentTasks.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border px-3 py-2 transition-colors hover:border-primary/20 hover:bg-accent/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.project?.name ?? "-"} · {new Date(t.updatedAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">{TASK_STATUS_LABELS[t.status as TaskStatusType] ?? t.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
