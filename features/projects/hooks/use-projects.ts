"use client"

import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import type { ProjectsResponse, ProjectDetail } from "@/features/projects/types"

type ProjectsParams = { page?: number; pageSize?: number; search?: string }

async function fetchProjects(params: ProjectsParams = {}): Promise<ProjectsResponse> {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params.search) sp.set("search", params.search)
  const res = await fetch(`/api/projects?${sp}`)
  if (!res.ok) throw new Error((await res.json()).error ?? "Lỗi tải projects")
  return res.json()
}

async function fetchProject(id: string): Promise<{ data: ProjectDetail }> {
  const res = await fetch(`/api/projects/${id}`)
  if (!res.ok) throw new Error("Không tìm thấy project")
  return res.json()
}

export function useProjects(params: ProjectsParams = {}) {
  return useQuery({ queryKey: ["projects", params], queryFn: () => fetchProjects(params), placeholderData: keepPreviousData })
}

export function useProject(id: string) {
  return useQuery({ queryKey: ["projects", id], queryFn: () => fetchProject(id), enabled: !!id })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string | null }) => {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Đã tạo project")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể tạo project"),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; description?: string | null }) => {
      const res = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["projects", v.id] })
      toast.success("Đã cập nhật project")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể cập nhật project"),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Đã xóa project")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể xóa project"),
  })
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) throw new Error("Lỗi tải members")
      return res.json() as Promise<{ data: { id: string; userId: string; projectId: string; role: string; user: { id: string; name: string | null; email: string; role: string } }[]; owner: { id: string; name: string | null; email: string } }>
    },
    enabled: !!projectId,
  })
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { userId: string; role?: string }) => {
      const res = await fetch(`/api/projects/${projectId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "members"] })
      qc.invalidateQueries({ queryKey: ["projects", projectId] })
      toast.success("Đã thêm thành viên")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể thêm thành viên"),
  })
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "members"] })
      qc.invalidateQueries({ queryKey: ["projects", projectId] })
      toast.success("Đã xóa thành viên")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể xóa thành viên"),
  })
}
