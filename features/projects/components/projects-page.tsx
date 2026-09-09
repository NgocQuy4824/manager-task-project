"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarDays, FolderPlus, ListChecks, Plus, Search, Trash2, Users } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjects, useDeleteProject } from "@/features/projects/hooks/use-projects"
import { ProjectAvatar } from "@/features/projects/components/project-avatar"

export function ProjectsPageContent() {
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProjects({ page, search: q || undefined })
  const delMut = useDeleteProject()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const projects = data?.data ?? []
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Tạo và quản lý các dự án cùng thành viên của bạn.</p>
        </div>
        <Button asChild className="gap-1.5 shadow-soft"><Link href="/projects/new"><Plus className="h-4 w-4" />Tạo project</Link></Button>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm project..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setQ(search), setPage(1))} className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => { setQ(search); setPage(1) }}>Tìm</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-44 rounded-xl" /><Skeleton className="h-44 rounded-xl" /><Skeleton className="h-44 rounded-xl" /></div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <FolderPlus className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium">Chưa có project nào</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {q ? "Không tìm thấy project khớp với từ khóa. Thử lại với từ khóa khác." : "Tạo project đầu tiên để bắt đầu giao việc và quản lý thành viên."}
          </p>
          {!q && (
            <Button asChild className="mx-auto mt-5 gap-1.5 shadow-soft"><Link href="/projects/new"><Plus className="h-4 w-4" />Tạo project</Link></Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id} className="group flex flex-col gap-0 border shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft-lg">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
                  <ProjectAvatar name={p.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base leading-6">
                      <Link href={`/projects/${p.id}`} className="transition-colors group-hover:text-primary">{p.name}</Link>
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2 min-h-[2.5rem]">{p.description || "Chưa có mô tả"}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <div className="flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{p._count?.tasks ?? 0}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{p._count?.members ?? 0}</span>
                    <span className="ml-auto inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(p.createdAt).toLocaleDateString("vi-VN")}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={delMut.isPending} onClick={() => setPendingDelete({ id: p.id, name: p.name })} aria-label={`Xóa ${p.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng {data.total} — trang {data.page}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
                <Button variant="outline" size="sm" disabled={(data.data.length ?? 0) < data.pageSize} onClick={() => setPage((p) => p + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null) }}
        title={`Xóa project "${pendingDelete?.name ?? ""}"?`}
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        busy={delMut.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          delMut.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}
