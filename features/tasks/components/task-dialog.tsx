"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useCreateTask, useUpdateTask, useTask } from "@/features/tasks/hooks/use-tasks"
import { useProjects, useProjectMembers } from "@/features/projects/hooks/use-projects"
import { TASK_STATUS_LABELS, KANBAN_STATUSES, ROLE_LABELS, type RoleType } from "@/lib/constants"
import type { TaskItem } from "@/features/tasks/types"

// Trường status chỉ dùng khi TẠO task (trạng thái khởi điểm). Khi SỬA thì ẩn đi:
// đổi trạng thái phải qua luồng chuyển có xác nhận (transition), không cho form bypass ma trận.
const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(300),
  description: z.string().max(10000).optional().nullable(),
  status: z.enum(["PENDING_APPROVAL", "TODO", "IN_PROGRESS", "PENDING_ACCEPTANCE", "DONE", "REJECTED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  projectId: z.string().min(1, "Chọn project"),
  assigneeId: z.string().optional().nullable(),
  executorId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

export function TaskDialog({ open, onOpenChange, editingId, defaultProjectId }: { open: boolean; onOpenChange: (v: boolean) => void; editingId?: string | null; defaultProjectId?: string }) {
  const { data: editingData } = useTask(editingId ?? "")
  const editing: TaskItem | undefined = editingData?.data
  const isEdit = !!editingId
  const createMut = useCreateTask()
  const updateMut = useUpdateTask()
  const projectsQ = useProjects({ pageSize: 50 })
  const [err, setErr] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", status: "TODO", priority: "MEDIUM", projectId: defaultProjectId ?? "", assigneeId: "", executorId: "", dueDate: "" },
  })

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (isEdit && editing) {
      form.reset({
        title: editing.title, description: editing.description ?? "", status: editing.status as FormValues["status"], priority: editing.priority,
        projectId: editing.projectId, assigneeId: editing.assigneeId ?? "", executorId: editing.executorId ?? "",
        dueDate: editing.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "",
      })
    } else {
      form.reset({ title: "", description: "", status: "TODO", priority: "MEDIUM", projectId: defaultProjectId ?? "", assigneeId: "", executorId: "", dueDate: "" })
    }
  }, [open, editing, isEdit, defaultProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: FormValues) {
    setErr(null)
    const payload: Record<string, unknown> = {
      title: values.title,
      description: values.description || null,
      priority: values.priority,
      projectId: values.projectId,
      assigneeId: values.assigneeId || null,
      executorId: values.executorId || null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    }
    if (!isEdit) payload.status = values.status
    try {
      if (isEdit && editingId) await updateMut.mutateAsync({ id: editingId, ...payload })
      else await createMut.mutateAsync(payload)
      onOpenChange(false)
    } catch (e: unknown) {
      setErr((e as { error?: unknown })?.error ? JSON.stringify((e as { error: unknown }).error) : (e as Error)?.message ?? "Lỗi")
    }
  }

  const pending = createMut.isPending || updateMut.isPending
  const NONE = "__none__"
  const compact = "h-9 text-sm"
  const watchedProjectId = form.watch("projectId")
  const membersQ = useProjectMembers(watchedProjectId ?? "")
  const memberOptions = membersQ.data?.data ?? []
  const hasProject = !!watchedProjectId
  function memberLabel(m: { role: string; user: { name: string | null; email: string } }): string {
    const name = m.user.name ? `${m.user.name} (${m.user.email})` : m.user.email
    const rl = (ROLE_LABELS[m.role as RoleType] ?? m.role) as string
    return `${name} — ${rl}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pb-3"><DialogTitle>{isEdit ? "Cập nhật task" : "Tạo task"}</DialogTitle></DialogHeader>
        {err && <p className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{err}</p>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Tiêu đề *</FormLabel><FormControl><Input className={compact} placeholder="VD: Thiết kế trang chủ" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea rows={2} className="resize-none text-sm" placeholder="Chi tiết..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem><FormLabel>Project *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <FormControl><SelectTrigger className={compact}><SelectValue placeholder="Chọn project" /></SelectTrigger></FormControl>
                    <SelectContent>{(projectsQ.data?.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Ưu tiên</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className={compact}><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Thấp</SelectItem><SelectItem value="MEDIUM">Trung bình</SelectItem><SelectItem value="HIGH">Cao</SelectItem><SelectItem value="URGENT">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              {!isEdit && (
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Trạng thái khởi tạo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className={compact}><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {KANBAN_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem><FormLabel>Hạn hoàn thành</FormLabel><FormControl><Input type="date" className={compact} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem><FormLabel>Người được giao</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)} disabled={!hasProject}>
                    <FormControl><SelectTrigger className={compact}><SelectValue placeholder={hasProject ? "—" : "Chọn project trước"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>— Không chọn —</SelectItem>
                      {hasProject && memberOptions.length === 0 && !membersQ.isLoading && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">Chưa có thành viên nào trong project này.</div>
                      )}
                      {memberOptions.map((m) => <SelectItem key={m.id} value={m.userId}>{memberLabel(m)}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="executorId" render={({ field }) => (
                <FormItem><FormLabel>Người thực hiện</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)} disabled={!hasProject}>
                    <FormControl><SelectTrigger className={compact}><SelectValue placeholder={hasProject ? "—" : "Chọn project trước"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>— Không chọn —</SelectItem>
                      {hasProject && memberOptions.length === 0 && !membersQ.isLoading && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">Chưa có thành viên nào trong project này.</div>
                      )}
                      {memberOptions.map((m) => <SelectItem key={m.id} value={m.userId}>{memberLabel(m)}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={pending}>{pending ? "..." : isEdit ? "Lưu" : "Tạo"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
