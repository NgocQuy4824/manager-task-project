"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, ListTodo, Loader2, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useCreateTask, useUpdateTask, useTask } from "@/features/tasks/hooks/use-tasks"
import { useProjects, useProjectMembers } from "@/features/projects/hooks/use-projects"
import { ROLE_LABELS, type RoleType } from "@/lib/constants"
import type { TaskItem } from "@/features/tasks/types"

// Server tự suy diễn trạng thái khởi tạo từ intent + quan hệ creator/assignee/executor
// (rule "Lưu ≠ Giao việc", 3 luồng). Client chỉ chọn ý định qua 2 nút: "Lưu nháp" / "Giao việc".
const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(300),
  description: z.string().max(10000).optional().nullable(),
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
    defaultValues: { title: "", description: "", priority: "MEDIUM", projectId: defaultProjectId ?? "", assigneeId: "", executorId: "", dueDate: "" },
  })

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (isEdit && editing) {
      form.reset({
        title: editing.title, description: editing.description ?? "", priority: editing.priority,
        projectId: editing.projectId, assigneeId: editing.assigneeId ?? "", executorId: editing.executorId ?? "",
        dueDate: editing.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "",
      })
    } else {
      form.reset({ title: "", description: "", priority: "MEDIUM", projectId: defaultProjectId ?? "", assigneeId: "", executorId: "", dueDate: "" })
    }
  }, [open, editing, isEdit, defaultProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tạo task mới: "Lưu nháp" (intent=draft — người thực hiện chưa thấy)
  // hoặc "Giao việc" (intent=assign — chính thức, server suy diễn luồng 1/2/3).
  async function onCreate(values: FormValues, intent: "draft" | "assign") {
    setErr(null)
    const payload: Record<string, unknown> = {
      title: values.title,
      description: values.description || null,
      intent,
      priority: values.priority,
      projectId: values.projectId,
      assigneeId: values.assigneeId || null,
      executorId: values.executorId || null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    }
    try {
      await createMut.mutateAsync(payload)
      onOpenChange(false)
    } catch (e: unknown) {
      setErr((e as { error?: unknown })?.error ? JSON.stringify((e as { error: unknown }).error) : (e as Error)?.message ?? "Lỗi")
    }
  }

  // Sửa task: chỉ đổi nội dung/người phụ trách — trạng thái đi qua luồng transition.
  async function onUpdate(values: FormValues) {
    if (!editingId) return
    setErr(null)
    try {
      await updateMut.mutateAsync({
        id: editingId,
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        projectId: values.projectId,
        assigneeId: values.assigneeId || null,
        executorId: values.executorId || null,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      })
      onOpenChange(false)
    } catch (e: unknown) {
      setErr((e as { error?: unknown })?.error ? JSON.stringify((e as { error: unknown }).error) : (e as Error)?.message ?? "Lỗi")
    }
  }

  const { data: session } = useSession()
  const pending = createMut.isPending || updateMut.isPending
  const NONE = "__none__"
  const watchedProjectId = form.watch("projectId")
  const membersQ = useProjectMembers(watchedProjectId ?? "")
  const memberOptions = membersQ.data?.data ?? []
  const owner = membersQ.data?.owner as { id: string; name: string | null; email: string } | undefined
  const hasProject = !!watchedProjectId
  function memberLabel(m: { role: string; user: { name: string | null; email: string } }): string {
    const name = m.user.name ? `${m.user.name} (${m.user.email})` : m.user.email
    const rl = (ROLE_LABELS[m.role as RoleType] ?? m.role) as string
    return `${name} — ${rl}`
  }
  function ownerLabel(o: { name: string | null; email: string }): string {
    const name = o.name ? `${o.name} (${o.email})` : o.email
    return `${name} — Chủ sở hữu`
  }
  const LEADER_ROLES_SET = new Set<string>(["ADMIN", "MANAGER"])
  const assigneeOptions = (() => {
    const seen = new Set<string>()
    const out: { value: string; label: string }[] = []
    function push(value: string, label: string) {
      if (seen.has(value)) return
      seen.add(value)
      out.push({ value, label })
    }
    if (owner) push(owner.id, ownerLabel(owner))
    for (const m of memberOptions) {
      if (LEADER_ROLES_SET.has(m.role)) push(m.userId, memberLabel(m))
    }
    return out
  })()
  const executorOptions = (() => {
    const seen = new Set<string>()
    const out: { value: string; label: string }[] = []
    function push(value: string, label: string) {
      if (seen.has(value)) return
      seen.add(value)
      out.push({ value, label })
    }
    if (owner) push(owner.id, ownerLabel(owner))
    for (const m of memberOptions) push(m.userId, memberLabel(m))
    return out
  })()

  useEffect(() => {
    if (!open || isEdit || !hasProject || !membersQ.data || !owner) return
    const cur = (form.getValues("assigneeId") ?? "") as string
    if (cur) return
    const sid = (session?.user as { id?: string } | undefined)?.id
    const iAmLeader = !!(sid && (sid === owner.id || memberOptions.some((m) => m.userId === sid && LEADER_ROLES_SET.has(m.role))))
    if (!iAmLeader) form.setValue("assigneeId", owner.id)
  }, [open, isEdit, hasProject, membersQ.data, owner, session, memberOptions, form]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hint dẫn user trước khi tạo: dựa trên quan hệ người tạo/người giao/người thực hiện
  // cho biết bấm "Giao việc" thì task đi Luồng nào (1: trình duyệt / 2: giao thẳng / 3: tự làm).
  const watchedAssigneeId = form.watch("assigneeId") as string | undefined
  const watchedExecutorId = form.watch("executorId") as string | undefined
  const myId = (session?.user as { id?: string } | undefined)?.id
  const createHint = (() => {
    const assigneeId = watchedAssigneeId || null
    const executorId = watchedExecutorId || null
    if (assigneeId && executorId && assigneeId === executorId)
      return "Tự tạo, tự làm: bấm «Giao việc» task vào thẳng danh sách, không cần ai duyệt."
    if (assigneeId && assigneeId !== myId)
      return "Giao cho người khác duyệt: bấm «Giao việc» task sẽ trình người giao phê duyệt trước, người thực hiện chưa thấy. Bấm «Lưu nháp» giữ riêng cho bạn."
    return "Bạn vừa tạo vừa giao: bấm «Giao việc» task vào thẳng danh sách. Bấm «Lưu nháp» giữ riêng cho bạn."
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-0 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-primary/10 text-primary">
              <ListTodo className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg">{isEdit ? "Cập nhật task" : "Tạo task"}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {isEdit ? "Chỉnh sửa nội dung và người phụ trách." : "Điền thông tin công việc, chọn người phụ trách rồi tạo."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {err && <p className="mb-1 mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{err}</p>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(isEdit ? onUpdate : (v) => onCreate(v, "assign"))} className="mt-3 space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" /> Tiêu đề <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl><Input placeholder="VD: Thiết kế trang chủ" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Mô tả
                </FormLabel>
                <FormControl><Textarea rows={3} className="resize-none text-sm" placeholder="Chi tiết công việc, tiêu chí hoàn thành..." {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem><FormLabel>Project <span className="text-destructive">*</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Chọn project" /></SelectTrigger></FormControl>
                    <SelectContent>{(projectsQ.data?.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Ưu tiên</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Thấp</SelectItem><SelectItem value="MEDIUM">Trung bình</SelectItem><SelectItem value="HIGH">Cao</SelectItem><SelectItem value="URGENT">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              {!isEdit && (
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>Hạn hoàn thành</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem><FormLabel>Người được giao</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)} disabled={!hasProject}>
                    <FormControl><SelectTrigger><SelectValue placeholder={hasProject ? "—" : "Chọn project trước"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>— Không chọn —</SelectItem>
                      {hasProject && assigneeOptions.length === 0 && !membersQ.isLoading && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">Chưa có leader nào trong project.</div>
                      )}
                      {assigneeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="executorId" render={({ field }) => (
                <FormItem><FormLabel>Người thực hiện</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)} disabled={!hasProject}>
                    <FormControl><SelectTrigger><SelectValue placeholder={hasProject ? "—" : "Chọn project trước"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>— Không chọn —</SelectItem>
                      {hasProject && executorOptions.length === 0 && !membersQ.isLoading && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">Chưa có thành viên nào trong project này.</div>
                      )}
                      {executorOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            {!isEdit && (
              <p className="rounded-xl border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                {createHint}
              </p>
            )}
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Hủy</Button>
              {isEdit ? (
                <Button type="submit" disabled={pending} className="gap-1.5 shadow-soft">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              ) : (
                <>
                  {/* "Lưu ≠ Giao việc": nút Lưu nháp giữ task riêng creator, nút Giao việc gửi chính thức. */}
                  <Button type="button" variant="outline" disabled={pending} className="gap-1.5"
                    onClick={form.handleSubmit((v) => onCreate(v, "draft"))}>
                    {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Lưu nháp
                  </Button>
                  <Button type="submit" disabled={pending} className="gap-1.5 shadow-soft">
                    {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Giao việc
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
