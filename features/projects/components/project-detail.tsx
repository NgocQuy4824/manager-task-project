"use client"

import Link from "next/link"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { ArrowLeft, Crown, ListChecks, Pencil, ShieldCheck, UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useProject, useProjectMembers, useAddMember, useRemoveMember } from "@/features/projects/hooks/use-projects"
import { useUsers } from "@/features/users/hooks/use-users"
import { ProjectAvatar } from "@/features/projects/components/project-avatar"

function memberInitial(name: string | null | undefined, email: string): string {
  const src = (name ?? email ?? "?").trim()
  if (!src) return "?"
  const last = src.split(/\s+/).pop() ?? src
  return last.charAt(0).toUpperCase()
}

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
    try {
      await addMut.mutateAsync({ userId: selectedUserId })
      setSelectedUserId("")
    } catch (e: unknown) {
      setErr((e as { error?: string })?.error ?? (e as Error)?.message ?? "Lỗi")
    }
  }

  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  if (!data?.data) return <p>Không tìm thấy project.</p>
  const p = data.data
  const ownerLabel = p.owner?.name ?? p.owner?.email ?? "Không rõ"
  const canManageMembers = role === "ADMIN" || (!!currentUserId && p.ownerId === currentUserId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
        <div className="flex gap-4">
          <ProjectAvatar name={p.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
            {p.description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{p.description}</p> : <p className="mt-1 text-sm text-muted-foreground">Chưa có mô tả</p>}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-soft">
                <Crown className="h-3.5 w-3.5" />
                {ownerLabel}
              </span>
              {p._count != null && (
                <span className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-1 text-xs tabular-nums">
                  <ListChecks className="h-3.5 w-3.5" />
                  {p._count.tasks} task
                </span>
              )}
              <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" className="gap-1.5 shadow-soft">
          <Link href={`/projects/${projectId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Sửa
          </Link>
        </Button>
      </div>

      <Card className="border shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Thành viên</CardTitle>
              <CardDescription>Người tham gia project này</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {err && <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{err}</p>}
          {canManageMembers && (
            <div className="flex flex-wrap gap-2 rounded-xl border border-dashed bg-muted/20 p-3">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="max-w-xs flex-1">
                  <SelectValue placeholder="Chọn user..." />
                </SelectTrigger>
                <SelectContent>
                  {(usersQ.data?.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onAdd} disabled={!selectedUserId || addMut.isPending} className="gap-1.5">
                <UserPlus className="h-4 w-4" /> Thêm
              </Button>
            </div>
          )}

          {membersQ.isLoading ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border bg-amber-100 text-xs font-semibold text-amber-800"
                >
                  {memberInitial(p.owner?.name, p.owner?.email ?? ownerLabel)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ownerLabel}</p>
                  <p className="text-xs text-muted-foreground">Chủ sở hữu</p>
                </div>
                <Badge variant="info" className="gap-1">
                  <Crown className="h-3 w-3" /> Owner
                </Badge>
              </div>

              {(membersQ.data?.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-primary/20"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border bg-secondary text-xs font-semibold"
                    >
                      {memberInitial(m.user.name, m.user.email)}
                    </span>
                    <span className="truncate text-sm">{m.user.name ?? m.user.email}</span>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {m.role}
                    </Badge>
                  </div>
                  {canManageMembers && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 text-destructive hover:text-destructive"
                      disabled={removeMut.isPending}
                      onClick={() => setPendingRemoveUserId(m.userId)}
                    >
                      Gỡ
                    </Button>
                  )}
                </div>
              ))}
              {(membersQ.data?.data ?? []).length === 0 && <p className="py-2 text-sm text-muted-foreground">Chưa có thành viên nào.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="gap-1.5 shadow-soft">
          <Link href={`/tasks?projectId=${projectId}`}>
            <ListChecks className="h-4 w-4" /> Xem tasks
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Link>
        </Button>
      </div>
      <ConfirmDialog
        open={!!pendingRemoveUserId}
        onOpenChange={(v) => {
          if (!v) setPendingRemoveUserId(null)
        }}
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
