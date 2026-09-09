"use client"

import Link from "next/link"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useProject, useProjectMembers, useAddMember, useRemoveMember } from "@/features/projects/hooks/use-projects"
import { useUsers } from "@/features/users/hooks/use-users"

export function ProjectDetailContent({ projectId }: { projectId: string }) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const currentUserId = (session?.user as { id?: string } | undefined)?.id
  const { data, isLoading } = useProject(projectId)
  const membersQ = useProjectMembers(projectId)
  const usersQ = useUsers({ pageSize: 50 })
  const addMut = useAddMember(projectId)
  const removeMut = useRemoveMember(projectId)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [pendingRemoveUserId, setPendingRemoveUserId] = useState<string | null>(null)

  async function onAdd() {
    if (!selectedUserId) return
    setErr(null)
    try { await addMut.mutateAsync({ userId: selectedUserId }); setSelectedUserId("") }
    catch (e: unknown) { setErr((e as { error?: string })?.error ?? (e as Error)?.message ?? "Lỗi") }
  }

  if (isLoading) return <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-40" /></div>
  if (!data?.data) return <p>Không tìm thấy project.</p>
  const p = data.data

  // Chỉ owner của project hoặc Admin mới được quản lý thành viên
  const canManageMembers = role === "ADMIN" || (!!currentUserId && p.ownerId === currentUserId)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
          {p.description && <p className="mt-1 text-muted-foreground">{p.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">Owner: {p.owner.name ?? p.owner.email}</p>
        </div>
        <Button asChild variant="outline" className="gap-1.5"><Link href={`/projects/${projectId}/edit`}><Pencil className="h-3.5 w-3.5" />Sửa</Link></Button>
      </div>

      <Card className="border shadow-soft">
        <CardHeader><CardTitle className="text-base font-semibold">Thành viên</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {err && <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{err}</p>}
          {canManageMembers && (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="max-w-xs"><SelectValue placeholder="Chọn user..." /></SelectTrigger>
                <SelectContent>
                  {(usersQ.data?.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name ? `${u.name} (${u.email})` : u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onAdd} disabled={!selectedUserId || addMut.isPending}>Thêm</Button>
            </div>
          )}

          {membersQ.isLoading ? <Skeleton className="h-10 w-full" /> : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium">{p.owner.name ?? p.owner.email}</span>
                <Badge variant="info">Owner</Badge>
              </div>
              {(membersQ.data?.data ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border px-3 py-2 transition-colors hover:border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{m.user.name ?? m.user.email}</span>
                    <Badge variant="secondary">{m.role}</Badge>
                  </div>
                  {canManageMembers && (
                    <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" disabled={removeMut.isPending} onClick={() => setPendingRemoveUserId(m.userId)}>Gỡ</Button>
                  )}
                </div>
              ))}
              {(membersQ.data?.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Chưa có thành viên nào.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild className="gap-1.5 shadow-soft"><Link href={`/tasks?projectId=${projectId}`}>Xem tasks</Link></Button>
        <Button asChild variant="outline" className="gap-1.5"><Link href="/projects"><ArrowLeft className="h-4 w-4" />Quay lại</Link></Button>
      </div>
      <ConfirmDialog
        open={!!pendingRemoveUserId}
        onOpenChange={(v) => { if (!v) setPendingRemoveUserId(null) }}
        title="Gỡ thành viên?"
        description="Thành viên sẽ bị gỡ khỏi project."
        confirmLabel="Gỡ"
        busy={removeMut.isPending}
        onConfirm={() => {
          if (!pendingRemoveUserId) return
          removeMut.mutate(pendingRemoveUserId, { onSuccess: () => setPendingRemoveUserId(null) })
        }}
      />
    </div>
  )
}
