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

export function useTransitionTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string; from?: string }) => {
      const res = await fetch(`/api/tasks/${id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason }) })
      const json = await res.json()
      if (!res.ok) throw json
      return json as { data: TaskItem }
    },
    onSuccess: (_d, v) => {
      toast.success(transitionMessage(v.from ?? "", v.status))
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["tasks", v.id] })
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể chuyển trạng thái"),
  })
}
