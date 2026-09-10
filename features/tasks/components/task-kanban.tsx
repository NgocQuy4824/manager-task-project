"use client"

import Link from "next/link"
import { CalendarClock, RotateCcw, User, UserCog } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, KANBAN_STATUSES } from "@/lib/constants"
import type { TaskStatusType, TaskPriorityType } from "@/lib/constants"
import type { TaskItem } from "@/features/tasks/types"
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { useState } from "react"

function statusVariant(s: string) {
  if (s === "PENDING_APPROVAL") return "warning" as const
  if (s === "TODO") return "secondary" as const
  if (s === "IN_PROGRESS") return "info" as const
  if (s === "PENDING_ACCEPTANCE") return "info" as const
  if (s === "REJECTED") return "destructive" as const
  return "success" as const
}

const COLUMN_DOT: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-500",
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  PENDING_ACCEPTANCE: "bg-violet-500",
  DONE: "bg-emerald-500",
  REJECTED: "bg-red-500",
}

const PRIORITY_BAR: Record<string, string> = {
  LOW: "bg-slate-300",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-amber-400",
  URGENT: "bg-red-500",
}

function formatDue(d: string) {
  return new Date(d).toLocaleDateString("vi-VN")
}

function isOverdue(task: TaskItem) {
  if (!task.dueDate) return false
  if (task.status === "DONE" || task.status === "REJECTED") return false
  return new Date(task.dueDate).getTime() < Date.now()
}

function SortableCard({ task, onRequestMove, onEdit, onDelete }: {
  task: TaskItem
  onRequestMove: (taskId: string, from: TaskStatusType, to: TaskStatusType) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { status: task.status } })
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const overdue = isOverdue(task)
  const needsRework = task.status === "IN_PROGRESS" && !!task.reviewNote

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full min-w-0 shrink-0 cursor-grab border bg-card shadow-soft transition-shadow hover:shadow-soft-lg active:cursor-grabbing">
      <div className={`h-1 w-full rounded-t-lg ${PRIORITY_BAR[task.priority] ?? "bg-muted"}`} />
      <CardContent className="space-y-2.5 p-3">
        <Link href={`/tasks/${task.id}`} className="block line-clamp-2 text-[13px] font-semibold leading-snug break-words text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>{task.title}</Link>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statusVariant(task.status)} className="text-[10px]">{TASK_STATUS_LABELS[task.status as TaskStatusType] ?? task.status}</Badge>
          <Badge variant="outline" className="text-[10px]">{TASK_PRIORITY_LABELS[task.priority as TaskPriorityType] ?? task.priority}</Badge>
          {needsRework && <Badge variant="destructive" className="gap-1 text-[10px]"><RotateCcw className="h-2.5 w-2.5" />Cần làm lại</Badge>}
        </div>
        <div className="space-y-1.5 border-t pt-2.5">
          <div className={`flex items-center gap-1.5 text-[11px] ${overdue ? "font-medium text-destructive" : task.dueDate ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
            <CalendarClock className={`h-3.5 w-3.5 shrink-0 ${overdue ? "text-destructive" : "opacity-70"}`} />
            {task.dueDate ? (
              <span className={overdue ? "rounded bg-destructive/10 px-1.5 py-0.5" : ""}>
                {overdue ? "Quá hạn · " : "Hạn: "}{formatDue(task.dueDate)}
              </span>
            ) : (
              <span>Chưa có hạn</span>
            )}
          </div>
          {task.assignee && (
            <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate">Giao: {task.assignee.name ?? task.assignee.email}</span>
            </div>
          )}
          {task.executor && (
            <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              <UserCog className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate">TH: {task.executor.name ?? task.executor.email}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {task.status === "PENDING_APPROVAL" && <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => onRequestMove(task.id, task.status as TaskStatusType, "TODO")}>Duyệt</Button>}
          {task.status === "PENDING_ACCEPTANCE" && <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => onRequestMove(task.id, task.status as TaskStatusType, "DONE")}>Nghiệm thu</Button>}
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(task.id)}>Sửa</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onDelete(task.id)}>Xóa</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Column({ status, tasks, onRequestMove, onEdit, onDelete }: {
  status: TaskStatusType
  tasks: TaskItem[]
  onRequestMove: (taskId: string, from: TaskStatusType, to: TaskStatusType) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const label = TASK_STATUS_LABELS[status]

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[65vh] min-h-[340px] w-[268px] shrink-0 flex-col rounded-xl border bg-muted/30 p-2.5 shadow-soft sm:w-[280px] ${isOver ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${COLUMN_DOT[status] ?? "bg-muted-foreground"}`} />
        <span className="truncate text-[13px] font-semibold">{label}</span>
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs tabular-nums">{tasks.length}</Badge>
      </div>
      <SortableContext id={status} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden py-0.5 pr-0.5">
          {tasks.map((t) => <SortableCard key={t.id} task={t} onRequestMove={onRequestMove} onEdit={onEdit} onDelete={onDelete} />)}
          {tasks.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">Kéo task vào đây</p>}
        </div>
      </SortableContext>
    </div>
  )
}

export function TaskKanban({ tasks, onRequestMove, onEdit, onDelete }: {
  tasks: TaskItem[]
  onRequestMove: (taskId: string, from: TaskStatusType, to: TaskStatusType) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const taskId = String(active.id)
    const overId = String(over.id)

    let targetStatus: string | null = null
    if ((KANBAN_STATUSES as string[]).includes(overId)) {
      targetStatus = overId
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }
    if (!targetStatus) return
    const dragged = tasks.find((t) => t.id === taskId)
    if (!dragged || dragged.status === targetStatus) return

    onRequestMove(taskId, dragged.status as TaskStatusType, targetStatus as TaskStatusType)
  }

  const grouped = KANBAN_STATUSES.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s) }))
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex w-max gap-2.5 pr-1">
          {grouped.map(({ status, tasks: colTasks }) => (
            <Column key={status} status={status} tasks={colTasks} onRequestMove={onRequestMove} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </div>
      <DragOverlay>{activeTask ? <Card className="w-[268px] opacity-90 shadow-lg"><CardContent className="p-3 text-[13px] font-semibold leading-snug break-words">{activeTask.title}</CardContent></Card> : null}</DragOverlay>
    </DndContext>
  )
}
