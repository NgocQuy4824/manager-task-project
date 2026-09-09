"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Plus, Search, UserPlus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ConfirmTransitionDialog } from "@/components/ui/confirm-transition-dialog"
import { toast } from "@/components/ui/toast"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants"
import type { TaskStatusType, TaskPriorityType } from "@/lib/constants"
import { isAllowedAdjacent } from "@/lib/workflow"
import { useTasks, useDeleteTask, useTransitionTask } from "@/features/tasks/hooks/use-tasks"
import { useProjects, useProjectMembers } from "@/features/projects/hooks/use-projects"
import { TaskDialog } from "@/features/tasks/components/task-dialog"
import { TaskKanban } from "@/features/tasks/components/task-kanban"
import { InviteMemberDialog } from "@/features/tasks/components/invite-member-dialog"
import { MembersDialog } from "@/features/tasks/components/members-dialog"
import type { TaskFilters } from "@/features/tasks/types"

const NONE = "__none__"
const LS_KEY = "tasks:selectedProjectId"

function statusVariant(s: string): "secondary" | "info" | "warning" | "success" | "destructive" | "outline" {
  if (s === "PENDING_APPROVAL") return "warning"
  if (s === "TODO") return "secondary"
  if (s === "IN_PROGRESS") return "info"
  if (s === "PENDING_ACCEPTANCE") return "info"
  if (s === "DONE") return "success"
  if (s === "REJECTED") return "destructive"
  return "outline"
}
function priorityVariant(p: string): "secondary" | "outline" | "warning" | "destructive" {
  if (p === "LOW") return "secondary"
  if (p === "MEDIUM") return "outline"
  if (p === "HIGH") return "warning"
  return "destructive"
}

type PendingMove = {
  taskId: string
  from: TaskStatusType
  to: TaskStatusType
  reason: string
  error?: string | null
}

function moveCopy(from: TaskStatusType, to: TaskStatusType): { title: string; description: string; confirmLabel: string; requireReason: boolean } {
  const base = {
    title: `Chuyển sang ${TASK_STATUS_LABELS[to]}`,
    description: `Chuyển task từ ${TASK_STATUS_LABELS[from]} sang ${TASK_STATUS_LABELS[to]}.`,
    confirmLabel: "Xác nhận chuyển",
    requireReason: false,
  }
  if (from === "PENDING_APPROVAL" && to === "TODO") return { ...base, title: "Duyệt task", description: "Đưa task từ Chờ duyệt sang Cần làm.", confirmLabel: "Xác nhận duyệt" }
  if (to === "TODO" && from === "PENDING_ACCEPTANCE") return { ...base, title: "Yêu cầu làm lại", description: "Trả task về Cần làm. Lý do sẽ hiển thị cho người thực hiện.", confirmLabel: "Gửi yêu cầu", requireReason: true }
  if (to === "REJECTED") return { ...base, title: "Từ chối", description: "Đưa task sang Bị từ chối. Lý do sẽ hiển thị cho người liên quan.", confirmLabel: "Xác nhận từ chối", requireReason: true }
  if (to === "DONE") return { ...base, title: "Nghiệm thu hoàn thành", description: "Chấp nhận và đưa task sang Hoàn thành.", confirmLabel: "Xác nhận hoàn thành" }
  if (to === "PENDING_ACCEPTANCE") return { ...base, title: "Gửi nghiệm thu", description: "Đưa task sang Chờ nghiệm thu để người review xử lý.", confirmLabel: "Xác nhận gửi" }
  return base
}

export function TasksPageContent() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialProjectId = sp.get("projectId") ?? ""

  const [filters, setFilters] = useState<TaskFilters>(() => {
    if (initialProjectId) return { projectId: initialProjectId }
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null
      if (saved) return { projectId: saved }
    } catch {}
    return {}
  })
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [view, setView] = useState<"list" | "kanban">("kanban")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const queryFilters: TaskFilters = { ...filters, page, pageSize: 50 }
  const hasProject = !!filters.projectId
  const { data, isLoading } = useTasks(queryFilters, hasProject)
  const projectsQ = useProjects({ pageSize: 50 })
  const membersQ = useProjectMembers(filters.projectId ?? "")
  const selectedProject = (projectsQ.data?.data ?? []).find((p) => p.id === filters.projectId)
  const memberCount = (() => {
    if (!filters.projectId) return null
    const ids = new Set((membersQ.data?.data ?? []).map((m) => m.userId))
    if (selectedProject) ids.add(selectedProject.ownerId)
    return ids.size
  })()

  useEffect(() => {
    const pid = filters.projectId ?? ""
    try {
      if (pid) localStorage.setItem(LS_KEY, pid)
      else localStorage.removeItem(LS_KEY)
    } catch {}
    const cur = sp.get("projectId") ?? ""
    if (cur === pid) return
    const next = new URLSearchParams(sp.toString())
    if (pid) next.set("projectId", pid)
    else next.delete("projectId")
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [filters.projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const delMut = useDeleteTask()
  const transMut = useTransitionTask()

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput || undefined }))
    setPage(1)
  }

  function requestMove(taskId: string, from: TaskStatusType, to: TaskStatusType) {
    if (from === to) return
    if (!isAllowedAdjacent(from, to)) {
      if (to === "PENDING_APPROVAL") toast.error("Không thể chuyển về trạng thái chờ duyệt")
      else toast.error("Task chỉ có thể chuyển sang trạng thái kề hợp lệ")
      return
    }
    setPendingMove({ taskId, from, to, reason: "", error: null })
  }

  async function confirmMove() {
    if (!pendingMove) return
    const cfg = moveCopy(pendingMove.from, pendingMove.to)
    const reasonTrim = pendingMove.reason.trim()
    if (cfg.requireReason && !reasonTrim) {
      setPendingMove((m) => m && { ...m, error: "Vui lòng nhập lý do" })
      return
    }
    try {
      await transMut.mutateAsync({ id: pendingMove.taskId, status: pendingMove.to, reason: reasonTrim || undefined, from: pendingMove.from })
      setPendingMove(null)
    } catch (e: unknown) {
      const msg =
        (e as { error?: string })?.error ??
        (e as { message?: string })?.message ??
        "Không thể chuyển trạng thái"
      const text = typeof msg === "string" ? msg : JSON.stringify(msg)
      setPendingMove((m) => m && { ...m, error: text })
    }
  }

  const moveCfg = pendingMove ? moveCopy(pendingMove.from, pendingMove.to) : null

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Theo dõi, lọc và quản lý tất cả công việc trong workspace.</p>
      </div>

      {/* Toolbar: filters + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm theo tiêu đề..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applySearch()} className="w-48 pl-9" />
          </div>
          <Button variant="outline" onClick={applySearch}>Tìm</Button>
        </div>
        <Select value={filters.projectId ?? ""} onValueChange={(v) => { setFilters((f) => ({ ...f, projectId: v })); setPage(1) }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Chọn project" /></SelectTrigger>
          <SelectContent>{(projectsQ.data?.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.status ?? NONE} onValueChange={(v) => { setFilters((f) => ({ ...f, status: v === NONE ? undefined : v })); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Tất cả trạng thái</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Chờ duyệt</SelectItem><SelectItem value="TODO">Cần làm</SelectItem><SelectItem value="IN_PROGRESS">Đang làm</SelectItem><SelectItem value="PENDING_ACCEPTANCE">Chờ nghiệm thu</SelectItem><SelectItem value="DONE">Hoàn thành</SelectItem><SelectItem value="REJECTED">Bị từ chối</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.priority ?? NONE} onValueChange={(v) => { setFilters((f) => ({ ...f, priority: v === NONE ? undefined : v })); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Ưu tiên" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Tất cả</SelectItem>
            <SelectItem value="LOW">Thấp</SelectItem><SelectItem value="MEDIUM">Trung bình</SelectItem><SelectItem value="HIGH">Cao</SelectItem><SelectItem value="URGENT">Khẩn cấp</SelectItem>
          </SelectContent>
        </Select>
        {(filters.search || filters.status || filters.priority || filters.projectId) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilters(filters.projectId ? { projectId: filters.projectId } : {}); setSearchInput(""); setPage(1) }}>Xóa lọc</Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-md border bg-card p-1 shadow-soft">
            <Button size="sm" variant={view === "kanban" ? "secondary" : "ghost"} onClick={() => setView("kanban")}>Kanban</Button>
            <Button size="sm" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")}>Danh sách</Button>
          </div>
          {filters.projectId && (
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-xs font-normal tabular-nums text-secondary-foreground transition-colors hover:bg-secondary/80"
              title="Xem thành viên của project"
            >
              <Users className="h-3.5 w-3.5" />
              {memberCount ?? 0} thành viên
            </button>
          )}
          <Button variant="outline" className="gap-1.5" disabled={!filters.projectId} title={!filters.projectId ? "Chọn project để mời thành viên" : undefined} onClick={() => filters.projectId && setInviteOpen(true)}><UserPlus className="h-4 w-4" />Mời</Button>
          <Button onClick={() => { setEditingId(null); setDialogOpen(true) }} className="gap-1.5 shadow-soft"><Plus className="h-4 w-4" />Tạo task</Button>
        </div>
      </div>

      {!hasProject ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="text-sm font-medium">Chọn project để xem tasks</p>
          <p className="mt-1 text-sm text-muted-foreground">Dữ liệu đầy đủ (mọi trạng thái) chỉ hiển thị sau khi bạn chọn một project.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
      ) : view === "kanban" ? (
        <TaskKanban tasks={data?.data ?? []} onRequestMove={requestMove} onEdit={(id) => { setEditingId(id); setDialogOpen(true) }} onDelete={(id) => setPendingDeleteId(id)} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <Table>
            <TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead>Project</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ưu tiên</TableHead><TableHead>Hạn</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data?.data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Không có task</TableCell></TableRow>
              ) : (data?.data ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium"><Link href={`/tasks/${t.id}`} className="hover:underline">{t.title}</Link></TableCell>
                  <TableCell className="text-sm">{t.project?.name ?? "-"}</TableCell>
                  <TableCell><Badge variant={statusVariant(t.status)}>{TASK_STATUS_LABELS[t.status as TaskStatusType] ?? t.status}</Badge></TableCell>
                  <TableCell><Badge variant={priorityVariant(t.priority)}>{TASK_PRIORITY_LABELS[t.priority as TaskPriorityType] ?? t.priority}</Badge></TableCell>
                  <TableCell className="text-sm">{t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {t.status === "PENDING_APPROVAL" && <Button size="sm" variant="secondary" onClick={() => requestMove(t.id, t.status as TaskStatusType, "TODO")}>Duyệt</Button>}
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(t.id); setDialogOpen(true) }}>Sửa</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={delMut.isPending} onClick={() => setPendingDeleteId(t.id)}>Xóa</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingId(null) }} editingId={editingId} defaultProjectId={filters.projectId} />
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} projectId={filters.projectId} projectName={(projectsQ.data?.data ?? []).find((p) => p.id === filters.projectId)?.name} />
      <MembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        projectId={filters.projectId}
        projectName={(projectsQ.data?.data ?? []).find((p) => p.id === filters.projectId)?.name}
        ownerId={selectedProject?.ownerId}
      />
      {moveCfg && (
        <ConfirmTransitionDialog
          open={!!pendingMove}
          onOpenChange={(v) => { if (!v) setPendingMove(null) }}
          title={moveCfg.title}
          description={moveCfg.description}
          toStatus={pendingMove?.to}
          requireReason={moveCfg.requireReason}
          reasonValue={pendingMove?.reason ?? ""}
          onReasonChange={(v) => setPendingMove((m) => m && { ...m, reason: v, error: null })}
          reasonError={pendingMove?.error}
          confirmLabel={moveCfg.confirmLabel}
          onConfirm={confirmMove}
          busy={transMut.isPending}
        />
      )}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(v) => { if (!v) setPendingDeleteId(null) }}
        title="Xóa task?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        busy={delMut.isPending}
        onConfirm={() => {
          if (!pendingDeleteId) return
          delMut.mutate(pendingDeleteId, { onSuccess: () => setPendingDeleteId(null) })
        }}
      />
    </div>
  )
}
