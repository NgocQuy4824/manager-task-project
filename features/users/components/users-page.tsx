"use client"

import { useMemo, useState } from "react"

import {
  Filter,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  useDeleteUser,
  useUpdateUser,
  useUsers,
  type UserStatusFilter,
} from "@/features/users/hooks/use-users"

import { UserDialog } from "@/features/users/components/user-dialog"

import type { UserListItem } from "@/features/users/types"

import { ROLE_LABELS } from "@/lib/constants"

type Props = {
  currentUserRole: string
}

export function UsersPageContent({
  currentUserRole,
}: Props) {
  const isAdmin = currentUserRole === "ADMIN"

  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")

  const [status, setStatus] =
    useState<UserStatusFilter>("ALL")

  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editing, setEditing] =
    useState<UserListItem | null>(null)

  const [pendingDelete, setPendingDelete] =
    useState<UserListItem | null>(null)

  const [deleteError, setDeleteError] =
    useState<string | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsers({
    page,
    pageSize: 20,
    search: q || undefined,
    status,
  })

  const updateMut = useUpdateUser()
  const deleteMut = useDeleteUser()

  const stats = useMemo(() => {
    const users = data?.data ?? []

    return {
      total: data?.total ?? 0,
      active: users.filter(
        (user) => user.isActive
      ).length,
    }
  }, [data])

  function onSearch() {
    setQ(search.trim())
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(user: UserListItem) {
    setEditing(user)
    setDialogOpen(true)
  }

  function handleStatusChange(
    user: UserListItem,
    value: string
  ) {
    if (!isAdmin) return

    updateMut.mutate({
      id: user.id,
      isActive: value === "ACTIVE",
    })
  }

  function handleRoleChange(
    user: UserListItem,
    value: string
  ) {
    if (!isAdmin) return

    updateMut.mutate({
      id: user.id,
      role: value,
    })
  }

  function handleDelete() {
    if (!pendingDelete) return

    setDeleteError(null)

    deleteMut.mutate(
      pendingDelete.id,
      {
        onSuccess: () => {
          setPendingDelete(null)
        },

        onError: (e: unknown) => {
          const error = e as {
            error?: string
            message?: string
          }

          setDeleteError(
            error.error ??
              error.message ??
              "Không xóa được người dùng"
          )
        },
      }
    )
  }

  return (
    <div className="min-h-full space-y-6">
      {/* HEADER */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-7 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <UsersRound className="h-8 w-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Quản lý Người Dùng
                </h1>

                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 px-3 py-1 text-primary"
                >
                  {stats.total} Tài khoản
                </Badge>

                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-600"
                >
                  {stats.active} Hoạt động
                </Badge>
              </div>

              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />

                {isAdmin
                  ? "Bạn có quyền Quản trị viên: Có thể phân quyền Vai trò & Đổi Trạng thái tất cả tài khoản"
                  : "Bạn chỉ có quyền xem danh sách tài khoản người dùng"}
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              onClick={openCreate}
              className="h-12 gap-2 rounded-xl px-6 shadow-lg shadow-primary/20"
            >
              <Plus className="h-5 w-5" />
              Thêm người dùng
            </Button>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch()
                }
              }}
              placeholder="Tìm kiếm theo Tên tài khoản, Họ tên, Email..."
              className="h-12 rounded-xl pl-12 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Trạng thái:
            </div>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(
                  value as UserStatusFilter
                )
                setPage(1)
              }}
            >
              <SelectTrigger className="h-12 w-[220px] rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  Tất cả trạng thái
                </SelectItem>

                <SelectItem value="ACTIVE">
                  Hoạt động
                </SelectItem>

                <SelectItem value="INACTIVE">
                  Vô hiệu hóa
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={onSearch}
              className="h-12 rounded-xl px-6"
            >
              Tìm kiếm
            </Button>
          </div>

          <div className="whitespace-nowrap text-sm text-muted-foreground xl:ml-auto">
            Kết quả tìm kiếm:{" "}
            <span className="font-semibold text-foreground">
              {data?.total ?? 0} người dùng
            </span>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {deleteError}
        </div>
      )}

      {/* TABLE */}
      {isLoading ? (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
          <p className="font-medium text-destructive">
            Không tải được danh sách:{" "}
            {(error as Error)?.message ??
              "Lỗi không xác định"}
          </p>

          <Button
            variant="outline"
            className="mt-3"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-14 min-w-[220px] px-6 font-semibold uppercase text-muted-foreground">
                      Thành viên
                    </TableHead>

                    <TableHead className="min-w-[150px] font-semibold uppercase text-muted-foreground">
                      Tên tài khoản
                    </TableHead>

                    <TableHead className="min-w-[190px] font-semibold uppercase text-muted-foreground">
                      Vai trò
                    </TableHead>

                    <TableHead className="min-w-[240px] font-semibold uppercase text-muted-foreground">
                      Email liên hệ
                    </TableHead>

                    <TableHead className="min-w-[190px] font-semibold uppercase text-muted-foreground">
                      Trạng thái
                    </TableHead>

                    <TableHead className="min-w-[140px] font-semibold uppercase text-muted-foreground">
                      Ngày khởi tạo
                    </TableHead>

                    {isAdmin && (
                      <TableHead className="min-w-[130px] text-right font-semibold uppercase text-muted-foreground">
                        Thao tác
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 7 : 6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Không tìm thấy người dùng
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.data ?? []).map(
                      (user) => (
                        <TableRow
                          key={user.id}
                          className="h-[82px]"
                        >
                          {/* MEMBER */}
                          <TableCell className="px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                  {getInitials(
                                    user.name,
                                    user.email
                                  )}
                                </div>

                                <span
                                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                                    user.isActive
                                      ? "bg-emerald-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold">
                                  {user.name ||
                                    "Chưa cập nhật"}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  Thành viên hệ thống
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* USERNAME */}
                          <TableCell>
                            <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-sm font-medium text-primary">
                              @{getUsername(user.email)}
                            </span>
                          </TableCell>

                          {/* ROLE */}
                          <TableCell>
                            {isAdmin ? (
                              <Select
                                value={user.role}
                                onValueChange={(
                                  value
                                ) =>
                                  handleRoleChange(
                                    user,
                                    value
                                  )
                                }
                                disabled={
                                  updateMut.isPending
                                }
                              >
                                <SelectTrigger className="h-9 w-[175px] rounded-full border-primary/20 bg-primary/5 font-medium text-primary">
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  <SelectItem value="ADMIN">
                                    👑 Quản trị viên
                                  </SelectItem>

                                  <SelectItem value="MANAGER">
                                    🧑‍💼 Quản lý
                                  </SelectItem>

                                  <SelectItem value="MEMBER">
                                    👤 Thành viên
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <RoleBadge
                                role={user.role}
                              />
                            )}
                          </TableCell>

                          {/* EMAIL */}
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <UserRound className="h-4 w-4" />
                              <span>
                                {user.email}
                              </span>
                            </div>
                          </TableCell>

                          {/* STATUS */}
                          <TableCell>
                            {isAdmin ? (
                              <Select
                                value={
                                  user.isActive
                                    ? "ACTIVE"
                                    : "INACTIVE"
                                }
                                onValueChange={(
                                  value
                                ) =>
                                  handleStatusChange(
                                    user,
                                    value
                                  )
                                }
                                disabled={
                                  updateMut.isPending
                                }
                              >
                                <SelectTrigger
                                  className={`h-9 w-[175px] rounded-full font-medium ${
                                    user.isActive
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                      : "border-gray-200 bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  <SelectItem value="ACTIVE">
                                    🟢 Hoạt động
                                  </SelectItem>

                                  <SelectItem value="INACTIVE">
                                    ⚪ Vô hiệu hóa
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <StatusBadge
                                active={
                                  user.isActive
                                }
                              />
                            )}
                          </TableCell>

                          {/* CREATED */}
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(
                              user.createdAt
                            )}
                          </TableCell>

                          {/* ACTIONS */}
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl"
                                  onClick={() =>
                                    openEdit(user)
                                  }
                                  title="Chỉnh sửa"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() =>
                                    setPendingDelete(
                                      user
                                    )
                                  }
                                  title="Xóa"
                                  disabled={
                                    deleteMut.isPending
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* PAGINATION */}
          {data &&
            data.total > data.pageSize && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Tổng{" "}
                  <span className="font-medium text-foreground">
                    {data.total}
                  </span>{" "}
                  người dùng — trang{" "}
                  <span className="font-medium text-foreground">
                    {data.page}
                  </span>
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage(
                        (value) =>
                          value - 1
                      )
                    }
                  >
                    Trước
                  </Button>

                  <Button
                    variant="outline"
                    disabled={
                      data.data.length <
                      data.pageSize
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          value + 1
                      )
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
        </>
      )}

      {/* DIALOG */}
      {isAdmin && (
        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
        />
      )}

      {/* DELETE */}
      {isAdmin && (
        <ConfirmDialog
          open={!!pendingDelete}
          onOpenChange={(value) => {
            if (!value) {
              setPendingDelete(null)
            }
          }}
          title={`Xóa ${pendingDelete?.name || pendingDelete?.email || ""}?`}
          description="Tài khoản và dữ liệu liên quan có thể bị ảnh hưởng. Hành động này không thể hoàn tác."
          confirmLabel="Xóa người dùng"
          busy={deleteMut.isPending}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

function getInitials(
  name: string | null,
  email: string
) {
  if (name?.trim()) {
    const parts = name
      .trim()
      .split(/\s+/)

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase()
    }

    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return email
    .slice(0, 2)
    .toUpperCase()
}

function getUsername(email: string) {
  return email.split("@")[0]
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  )
}

function RoleBadge({
  role,
}: {
  role: string
}) {
  const config = {
    ADMIN: {
      label: "👑 Quản trị viên",
      className:
        "border-primary/20 bg-primary/5 text-primary",
    },

    MANAGER: {
      label: "🧑‍💼 Quản lý",
      className:
        "border-blue-200 bg-blue-50 text-blue-600",
    },

    MEMBER: {
      label: "👤 Thành viên",
      className:
        "border-indigo-200 bg-indigo-50 text-indigo-600",
    },
  }[role] ?? {
    label: role,
    className:
      "border-gray-200 bg-gray-50 text-gray-600",
  }

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-3 py-1 ${config.className}`}
    >
      {config.label}
    </Badge>
  )
}

function StatusBadge({
  active,
}: {
  active: boolean
}) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-600"
          : "rounded-full border-gray-200 bg-gray-100 px-3 py-1 text-gray-500"
      }
    >
      {active
        ? "🟢 Hoạt động"
        : "⚪ Vô hiệu hóa"}
    </Badge>
  )
}