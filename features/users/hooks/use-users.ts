"use client"

import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import type { UsersResponse, UserDetail } from "@/features/users/types"

type UsersParams = { page?: number; pageSize?: number; search?: string }

async function fetchUsers(params: UsersParams = {}): Promise<UsersResponse> {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params.search) sp.set("search", params.search)
  const res = await fetch(`/api/users?${sp}`)
  if (!res.ok) throw new Error((await res.json()).error ?? "Lỗi tải users")
  return res.json()
}

async function fetchUser(id: string): Promise<{ data: UserDetail }> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error("Không tìm thấy user")
  return res.json()
}

export function useUsers(params: UsersParams = {}) {
  return useQuery({ queryKey: ["users", params], queryFn: () => fetchUsers(params), placeholderData: keepPreviousData })
}

export function useUser(id: string) {
  return useQuery({ queryKey: ["users", id], queryFn: () => fetchUser(id), enabled: !!id })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; password: string; name?: string; role?: string }) => {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Đã tạo user")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể tạo user"),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; role?: string; email?: string; password?: string }) => {
      const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["users"] })
      qc.invalidateQueries({ queryKey: ["users", vars.id] })
      toast.success("Đã cập nhật user")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể cập nhật user"),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw json
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Đã xóa user")
    },
    onError: (e: unknown) => toast.fromError(e, "Không thể xóa user"),
  })
}
