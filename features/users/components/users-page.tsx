"use client"

import { useState } from "react"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLE_LABELS } from "@/lib/constants"
import { useUsers, useDeleteUser } from "@/features/users/hooks/use-users"
import { UserDialog } from "@/features/users/components/user-dialog"
import type { UserListItem } from "@/features/users/types"

export function UsersPageContent() {
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { data, isLoading, isError, error, refetch } = useUsers({ page, pageSize: 20, search: q || undefined })
  const delMut = useDeleteUser()

  function onSearch() { setQ(search); setPage(1) }

  const [pendingDelete, setPendingDelete] = useState<{ id: string; email: string } | null>(null)

  function onDelete(id: string) {
    setDeleteError(null)
    delMut.mutate(id, {
      onSuccess: () => setPendingDelete(null),
      onError: (e: unknown) =>
        setDeleteError((e as { error?: string })?.error ?? "Không xóa được user này"),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Thêm, sửa và phân quyền tài khoản trong hệ thống.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className="gap-1.5 shadow-soft">
          <Plus className="h-4 w-4" />Tạo user
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm email/tên..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()} className="pl-9" />
        </div>
        <Button variant="outline" onClick={onSearch}>Tìm</Button>
      </div>

      {deleteError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
          {deleteError}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">Không tải được danh sách: {(error as Error)?.message ?? "Lỗi không xác định"}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Tên</TableHead><TableHead>Vai trò</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
              <TableBody>
                {(data?.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                ) : (data?.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.name ?? "-"}</TableCell>
                    <TableCell><Badge variant={u.role === "ADMIN" ? "destructive" : u.role === "MANAGER" ? "info" : "secondary"}>{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditing(u); setDialogOpen(true) }}><Pencil className="h-3.5 w-3.5" />Sửa</Button>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={delMut.isPending} onClick={() => setPendingDelete({ id: u.id, email: u.email })}><Trash2 className="h-3.5 w-3.5" />Xóa</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng {data.total} — trang {data.page}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
                <Button variant="outline" size="sm" disabled={data.data.length < data.pageSize} onClick={() => setPage((p) => p + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </>
      )}

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null) }}
        title={`Xóa ${pendingDelete?.email ?? ""}?`}
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        busy={delMut.isPending}
        onConfirm={() => { if (pendingDelete) onDelete(pendingDelete.id) }}
      />
    </div>
  )
}
