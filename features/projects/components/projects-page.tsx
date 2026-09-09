"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjects, useDeleteProject } from "@/features/projects/hooks/use-projects"

export function ProjectsPageContent() {
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProjects({ page, search: q || undefined })
  const delMut = useDeleteProject()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  return (
    <div className="space-y-4">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : (data?.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">Chưa có project nào.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.data ?? []).map((p) => (
              <Card key={p.id} className="flex flex-col border shadow-soft transition-colors hover:border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base"><Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link></CardTitle>
                  {p.description && <CardDescription className="line-clamp-2">{p.description}</CardDescription>}
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span>{p._count ? `${p._count.tasks} task · ${p._count.members} thành viên` : new Date(p.createdAt).toLocaleDateString("vi-VN")}</span>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" disabled={delMut.isPending} onClick={() => setPendingDelete({ id: p.id, name: p.name })}>Xóa</Button>
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
