"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, CalendarClock, Clock3, Pencil, Trash2, User, UserCog, UserPlus, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ConfirmTransitionDialog } from "@/components/ui/confirm-transition-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskDialog } from "@/features/tasks/components/task-dialog"
import { useTask, useDeleteTask, useTransitionTask } from "@/features/tasks/hooks/use-tasks"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants"
import type { TaskStatusType, TaskPriorityType } from "@/lib/constants"
import type { TaskTransitionItem } from "@/features/tasks/types"

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

type MoveConfig = {
  title: string
  description: string
  confirmLabel: string
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
}

const MOVES: Record<string, MoveConfig> = {
  approveStart: { title: "Duyệt task", description: "Đưa task từ Chờ duyệt sang Cần làm để bắt đầu thực hiện.", confirmLabel: "Xác nhận duyệt" },
  startWork: { title: "Bắt đầu làm", description: "Đưa task từ Cần làm sang Đang làm.", confirmLabel: "Xác nhận bắt đầu" },
  backToTodo: { title: "Đưa về Cần làm", description: "Đưa task từ Đang làm trở lại Cần làm.", confirmLabel: "Xác nhận" },
  submitReview: { title: "Gửi nghiệm thu", description: "Đưa task từ Đang làm sang Chờ nghiệm thu để người review xử lý.", confirmLabel: "Xác nhận gửi" },
  accept: { title: "Nghiệm thu hoàn thành", description: "Chấp nhận và đưa task sang Hoàn thành.", confirmLabel: "Xác nhận hoàn thành" },
  rework: { title: "Trả về Đang làm", description: "Trả task từ Chờ nghiệm thu về Đang làm. Lý do sẽ hiển thị cho người thực hiện.", confirmLabel: "Gửi yêu cầu", requireReason: true, reasonLabel: "Lý do trả về *", reasonPlaceholder: "Giải thích vì sao cần làm lại..." },
  reopen: { title: "Mở lại Đang làm", description: "Mở lại task từ Hoàn thành về Đang làm. Lý do sẽ hiển thị cho người thực hiện.", confirmLabel: "Xác nhận mở lại", requireReason: true, reasonLabel: "Lý do mở lại *", reasonPlaceholder: "Giải thích vì sao cần mở lại..." },
  redo: { title: "Làm lại", description: "Đưa task từ Bị từ chối trở lại Cần làm.", confirmLabel: "Xác nhận làm lại" },
}

export function TaskDetailContent({ taskId }: { taskId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role as string | undefined
  const userId = (session?.user as { id?: string } | undefined)?.id as string | undefined
  const { data, isLoading } = useTask(taskId)
  const delMut = useDeleteTask()
  const transMut = useTransitionTask()
  const [editOpen, setEditOpen] = useState(false)
  const [move, setMove] = useState<{ key: string; status: TaskStatusType } | null>(null)
  const [reason, setReason] = useState("")
  const [reasonErr, setReasonErr] = useState<string | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-40" /></div>
  const t = data?.data
  if (!t) return <p>Không tìm thấy task.</p>

  const isAdmin = role === "ADMIN"
  const isManager = role === "MANAGER"
  const isCreator = !!userId && userId === t.creatorId
  const isAssignee = !!userId && userId === t.assigneeId
  const isExecutor = !!userId && userId === t.executorId
  const isRelated = isCreator || isAssignee || isExecutor

  const isReviewer = isAdmin || isManager || isCreator

  // Nút hành động theo ma trận chuyển trạng thái tuyến tính
  const canApproveStart = (isAdmin || isManager || isCreator || isAssignee) && t.status === "PENDING_APPROVAL"
  const canStartWork = (isAdmin || isExecutor || isAssignee) && t.status === "TODO"
  const canBackToTodo = (isAdmin || isExecutor || isAssignee || isCreator || isManager) && t.status === "IN_PROGRESS"
  const canSubmitReview = (isAdmin || isExecutor || isAssignee || isCreator) && t.status === "IN_PROGRESS"
  const canAccept = isReviewer && t.status === "PENDING_ACCEPTANCE"
  const canRework = isReviewer && t.status === "PENDING_ACCEPTANCE"
  const canReopen = isReviewer && t.status === "DONE"
  const canRedo = (isRelated || isAdmin) && t.status === "REJECTED"

  const showAwaitingBanner = t.status === "PENDING_ACCEPTANCE"
  const showReviewNote = (t.status === "IN_PROGRESS" || t.status === "REJECTED") && !!t.reviewNote

  function openMove(key: string, status: TaskStatusType) {
    setReason("")
    setReasonErr(null)
    setActionErr(null)
    setMove({ key, status })
  }

  async function confirmMove() {
    if (!move) return
    const cfg = MOVES[move.key]
    if (cfg.requireReason && !reason.trim()) {
      setReasonErr("Vui lòng nhập lý do")
      return
    }
    setActionErr(null)
    try {
      await transMut.mutateAsync({ id: t!.id, status: move.status, reason: reason.trim() || undefined, from: t!.status })
      setMove(null)
    } catch (e: unknown) {
      const msg =
        (e as { error?: string })?.error ??
        (e as { message?: string })?.message ??
        "Không thể chuyển trạng thái"
      const text = typeof msg === "string" ? msg : JSON.stringify(msg)
      if (cfg.requireReason) setReasonErr(text)
      else setActionErr(text)
    }
  }

  function handleDelete() {
    delMut.mutate(t!.id, { onSuccess: () => router.push("/tasks") })
  }

  const transitions: TaskTransitionItem[] = t.transitions ?? []
  const activeMoveCfg = move ? MOVES[move.key] : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 animate-fade-in-up">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight">{t.title}</h1>
          {t.project && <Link href={`/projects/${t.project.id}`} className="text-sm text-muted-foreground hover:underline">{t.project.name}</Link>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Sửa</Button>
          <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5" />Xóa</Button>
        </div>
      </div>

      {showAwaitingBanner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <span className="font-semibold">Đang chờ nghiệm thu.</span> Task này đã được gửi để review.
          {isReviewer && <span className="ml-2">Bạn có thể nghiệm thu hoàn thành hoặc trả về Đang làm bên dưới.</span>}
        </div>
      )}

      {showReviewNote && (
        <Card className="border-destructive/20 bg-destructive/10 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-destructive">Lý do phản hồi</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{t.reviewNote}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border shadow-soft">
        <CardHeader><CardTitle className="text-base font-semibold">Hành động</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {actionErr && <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionErr}</p>}
          <div className="flex flex-wrap gap-2">
            {canApproveStart && <Button onClick={() => openMove("approveStart", "TODO")} disabled={transMut.isPending}>Duyệt để bắt đầu</Button>}
            {canStartWork && <Button onClick={() => openMove("startWork", "IN_PROGRESS")} disabled={transMut.isPending}>Bắt đầu làm</Button>}
            {canBackToTodo && <Button variant="outline" onClick={() => openMove("backToTodo", "TODO")} disabled={transMut.isPending}>Đưa về Cần làm</Button>}
            {canSubmitReview && <Button onClick={() => openMove("submitReview", "PENDING_ACCEPTANCE")} disabled={transMut.isPending}>Gửi nghiệm thu</Button>}
            {canAccept && <Button onClick={() => openMove("accept", "DONE")} disabled={transMut.isPending}>Nghiệm thu hoàn thành</Button>}
            {canRework && <Button variant="outline" onClick={() => openMove("rework", "IN_PROGRESS")} disabled={transMut.isPending}>Trả về Đang làm</Button>}
            {canReopen && <Button variant="outline" onClick={() => openMove("reopen", "IN_PROGRESS")} disabled={transMut.isPending}>Mở lại Đang làm</Button>}
            {canRedo && <Button variant="outline" onClick={() => openMove("redo", "TODO")} disabled={transMut.isPending}>Làm lại</Button>}
            {!(canApproveStart || canStartWork || canBackToTodo || canSubmitReview || canAccept || canRework || canReopen || canRedo) && (
              <span className="text-sm text-muted-foreground">
                {isRelated || isAdmin ? "Không có hành động nào khả dụng cho trạng thái hiện tại." : "Bạn không có quyền thao tác task này."}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4 text-muted-foreground" /> Thông tin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {t.description ? (
            <p className="whitespace-pre-wrap rounded-xl border bg-muted/40 p-3.5 leading-relaxed">{t.description}</p>
          ) : (
            <p className="rounded-xl border border-dashed bg-muted/30 px-3.5 py-3 text-muted-foreground">Chưa có mô tả.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(t.status)}>{TASK_STATUS_LABELS[t.status as TaskStatusType] ?? t.status}</Badge>
            <Badge variant={priorityVariant(t.priority)}>{TASK_PRIORITY_LABELS[t.priority as TaskPriorityType] ?? t.priority}</Badge>
            {t.dueDate ? (
              (() => {
                const overdue = t.status !== "DONE" && t.status !== "REJECTED" && new Date(t.dueDate!).getTime() < Date.now()
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${overdue ? "border-destructive/30 bg-destructive/10 font-medium text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    {overdue ? "Quá hạn · " : "Hạn: "}{new Date(t.dueDate!).toLocaleDateString("vi-VN")}
                  </span>
                )
              })()
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 opacity-60" /> Chưa có hạn
              </span>
            )}
          </div>
          <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 truncate text-muted-foreground">
              <User className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">Người tạo: <span className="font-medium text-foreground">{t.creator?.name ?? t.creator?.email ?? "—"}</span></span>
            </div>
            <div className="flex items-center gap-2 truncate text-muted-foreground">
              <UserPlus className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">Giao cho: <span className="font-medium text-foreground">{t.assignee?.name ?? t.assignee?.email ?? "—"}</span></span>
            </div>
            <div className="flex items-center gap-2 truncate text-muted-foreground">
              <UserCog className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">Thực hiện: <span className="font-medium text-foreground">{t.executor?.name ?? t.executor?.email ?? "—"}</span></span>
            </div>
            <div className="flex items-center gap-2 truncate text-muted-foreground">
              <Clock3 className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">Tạo lúc: <span className="font-medium text-foreground">{new Date(t.createdAt).toLocaleString("vi-VN")}</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-soft">
        <CardHeader><CardTitle className="text-base font-semibold">Lịch sử trạng thái</CardTitle></CardHeader>
        <CardContent>
          {transitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có lịch sử chuyển trạng thái.</p>
          ) : (
            <ol className="space-y-3">
              {transitions.map((tr) => (
                <li key={tr.id} className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {tr.from ? (
                        <span className="text-muted-foreground">{TASK_STATUS_LABELS[tr.from]} → </span>
                      ) : (
                        <span className="text-muted-foreground">Khởi tạo → </span>
                      )}
                      <span className="font-medium">{TASK_STATUS_LABELS[tr.to]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tr.actor?.name ?? tr.actor?.email ?? "Hệ thống"} · {new Date(tr.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {tr.reason && <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/40 px-2 py-1 text-xs">{tr.reason}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {activeMoveCfg && (
        <ConfirmTransitionDialog
          open={!!move}
          onOpenChange={(v) => { if (!v) setMove(null) }}
          title={activeMoveCfg.title}
          description={activeMoveCfg.description}
          toStatus={move?.status}
          requireReason={activeMoveCfg.requireReason}
          reasonLabel={activeMoveCfg.reasonLabel}
          reasonPlaceholder={activeMoveCfg.reasonPlaceholder}
          reasonValue={reason}
          onReasonChange={setReason}
          reasonError={reasonErr}
          confirmLabel={activeMoveCfg.confirmLabel}
          onConfirm={confirmMove}
          busy={transMut.isPending}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa task?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        busy={delMut.isPending}
        onConfirm={handleDelete}
      />

      <Button variant="outline" onClick={() => router.back()} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Quay lại</Button>
      <TaskDialog open={editOpen} onOpenChange={setEditOpen} editingId={taskId} />
    </div>
  )
}
