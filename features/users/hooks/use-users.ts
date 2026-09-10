"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { toast } from "@/components/ui/toast"

import type {
  UsersResponse,
  UserDetail,
} from "@/features/users/types"

export type UserStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE"

type UsersParams = {
  page?: number
  pageSize?: number
  search?: string
  status?: UserStatusFilter
}

async function fetchUsers(
  params: UsersParams = {}
): Promise<UsersResponse> {
  const sp = new URLSearchParams()

  if (params.page) {
    sp.set("page", String(params.page))
  }

  if (params.pageSize) {
    sp.set("pageSize", String(params.pageSize))
  }

  if (params.search) {
    sp.set("search", params.search)
  }

  if (params.status && params.status !== "ALL") {
    sp.set("status", params.status)
  }

  const res = await fetch(`/api/users?${sp.toString()}`)

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      typeof json.error === "string"
        ? json.error
        : "Lỗi tải danh sách người dùng"
    )
  }

  return json
}

async function fetchUser(
  id: string
): Promise<{ data: UserDetail }> {
  const res = await fetch(`/api/users/${id}`)

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json.error ?? "Không tìm thấy người dùng"
    )
  }

  return json
}

export function useUsers(
  params: UsersParams = {}
) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (body: {
      email: string
      password: string
      name?: string
      role?: string
      isActive?: boolean
    }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        throw json
      }

      return json
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["users"],
      })

      toast.success("Đã tạo người dùng")
    },

    onError: (e: unknown) => {
      toast.fromError(
        e,
        "Không thể tạo người dùng"
      )
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string
      name?: string
      role?: string
      email?: string
      password?: string
      isActive?: boolean
    }) => {
      const res = await fetch(
        `/api/users/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw json
      }

      return json
    },

    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["users"],
      })

      qc.invalidateQueries({
        queryKey: ["users", vars.id],
      })

      toast.success("Đã cập nhật người dùng")
    },

    onError: (e: unknown) => {
      toast.fromError(
        e,
        "Không thể cập nhật người dùng"
      )
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/users/${id}`,
        {
          method: "DELETE",
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw json
      }

      return json
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["users"],
      })

      toast.success("Đã xóa người dùng")
    },

    onError: (e: unknown) => {
      toast.fromError(
        e,
        "Không thể xóa người dùng"
      )
    },
  })
}