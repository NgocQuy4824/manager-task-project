"use client"

import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useProjectMembers } from "@/features/projects/hooks/use-projects"

function initials(name: string | null | undefined, email: string) {
  const base = name?.trim() || email
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

export function MembersDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  ownerId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectId?: string
  projectName?: string
  ownerId?: string
}) {
  const membersQ = useProjectMembers(projectId ?? "")
  const members = membersQ.data?.data ?? []
  const owner = membersQ.data?.owner

  const rows = [
    ...(owner ? [{ key: `owner-${owner.id}`, id: owner.id, name: owner.name, email: owner.email, isOwner: true }] : []),
    ...members
      .filter((m) => m.userId !== ownerId)
      .map((m) => ({ key: m.id, id: m.userId, name: m.user?.name, email: m.user?.email ?? "", isOwner: false })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Thành viên project
          </DialogTitle>
          <DialogDescription>{projectName ?? "Danh sách thành viên trong project hiện tại."}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
          {membersQ.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có thành viên nào.</p>
          ) : (
            rows.map((r) => (
              <div key={r.key} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {initials(r.name, r.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name ?? r.email}</p>
                  {r.name && <p className="truncate text-xs text-muted-foreground">{r.email}</p>}
                </div>
                {r.isOwner && <Badge variant="secondary" className="shrink-0 text-[10px]">Chủ sở hữu</Badge>}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
