"use client"

import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { TASK_STATUS_LABELS } from "@/lib/constants"
import type { TaskStatusType } from "@/lib/constants"
import type { TasksResponse, TaskItem, TaskFilters } from "@/features/tasks/types"

function transitionMessage(from: string, to: string): string {
  if (from === "PENDING_APPROVAL" && to === "TODO") return "Đã duyệt task"
  if (to === "TODO" && from === "PENDING_ACCEPTANCE") return "Đã yêu cầu làm lại"
  if (to === "REJECTED") return "Đã từ chối task"
  if (to === "DONE") return "Đã nghiệm thu hoàn thành"
  if (to === "PENDING_ACCEPTANCE") return "Đã gửi nghiệm thu"
  if (to === "IN_PROGRESS") return "Đã bắt đầu làm"
  if (to === "TODO") return "Đã đưa về Cần làm"
  return `Đã chuyển sang ${TASK_STATUS_LABELS[to as TaskStatusType] ?? to}`
}

async function fetchTasks(params: TaskFilters = {}): Promise<TasksResponse> {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, String(v)) })
  const res = await fetch(`/api/tasks?${sp}`)
  if (!res.ok) throw new Error((await res.json()).error ?? "Lỗi tải tasks")
  return res.json()
}

async function fetchTask(id: string): Promise<{ data: TaskItem }> {
  const res = await fetch(`/api/tasks/${id}`)
  if (!res.ok) throw new Error("Không tìm thấy task")
  return res.json()
}

export function useTasks(params: TaskFilters = {}, enabled = true) {
  return useQuery({ queryKey: ["tasks", params], queryFn: () => fetchTasks(params), placeholderData: keepPreviousData, enabled })
}

export function useTask(id: string) {
  return useQuery({ queryKey: ["tasks", id], queryFn: () => fetchTask(id), enabled: !!id })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Đã tạo task")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể tạo task"),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["tasks", v.id] })
      toast.success("Đã cập nhật task")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể cập nhật task"),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Đã xóa task")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể xóa task"),
  })
}

// Mô phỏng đúng side-effect của API transition để card cập nhật tức thì.
function applyOptimisticTransition(t: TaskItem, to: string, reason?: string): TaskItem {
  const next: TaskItem = { ...t, status: to as TaskItem["status"] }
  if (to === "PENDING_ACCEPTANCE") { next.pendingApproval = false; next.reviewNote = null }
  else if (to === "DONE") { next.pendingApproval = false; next.isDraft = false }
  else if (to === "IN_PROGRESS") { next.pendingApproval = false }
  else if (to === "REJECTED") { next.pendingApproval = false; next.reviewNote = reason ?? null }
  else if (to === "TODO") {
    next.pendingApproval = false
    if (t.status === "PENDING_ACCEPTANCE") next.reviewNote = reason ?? null
    else if (t.status === "REJECTED") next.reviewNote = null
  }
  return next
}

export function useTransitionTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string; from?: string }) => {
      const res = await fetch(`/api/tasks/${id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason }) })
      const json = await res.json()
      if (!res.ok) throw json
      return json as { data: TaskItem }
    },
    // Ghi cache ngay khi xác nhận: card nhảy sang cột đích lập tức, API/history vẫn chạy nền.
    onMutate: async ({ id, status, reason }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] })
      const snapshot = qc.getQueriesData({ queryKey: ["tasks"] })
      qc.setQueriesData({ queryKey: ["tasks"] }, (prev: unknown) => {
        if (Array.isArray((prev as TasksResponse)?.data)) {
          const list = prev as TasksResponse
          return { ...list, data: list.data.map((t) => (t.id === id ? applyOptimisticTransition(t, status, reason) : t)) }
        }
        if ((prev as { data?: TaskItem })?.data?.id === id) {
          return { data: applyOptimisticTransition((prev as { data: TaskItem }).data, status, reason) }
        }
        return prev
      })
      return { snapshot }
    },
    onSuccess: (_d, v) => {
      toast.success(transitionMessage(v.from ?? "", v.status))
    },
    onSettled: (_d, _e, v) => {
      // Đối chiếu lại với server (kể cả lịch sử chuyển trạng thái).
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["tasks", v.id] })
    },
    onError: (e: unknown, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.fromError(e, "Không thể chuyển trạng thái")
    },
  })
}
