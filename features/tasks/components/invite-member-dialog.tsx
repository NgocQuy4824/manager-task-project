"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { useProjects, useProjectMembers, useAddMember } from "@/features/projects/hooks/use-projects"
import { useUsers } from "@/features/users/hooks/use-users"
import { ROLES, ROLE_LABELS, type RoleType } from "@/lib/constants"

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
  projectName: projectNameProp,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectId?: string
  projectName?: string
}) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const currentUserId = (session?.user as { id?: string } | undefined)?.id

  const [selectedProjectId, setSelectedProjectId] = useState("")
  const effectiveProjectId = projectId ?? selectedProjectId
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState<RoleType>("MEMBER")
  const [err, setErr] = useState<string | null>(null)

  // Khi parent truyền projectId cố định, đồng bộ 1 lần
  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId)
  }, [projectId])

  const myTasksQ = useTasks(
    currentUserId ? { creatorId: currentUserId, pageSize: 100 } : { pageSize: 1 },
  )
  const projectsQ = useProjects({ pageSize: 100 })
  const usersQ = useUsers({ pageSize: 100 })
  const membersQ = useProjectMembers(effectiveProjectId)
  const addMut = useAddMember(effectiveProjectId)

  const createdProjectIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of myTasksQ.data?.data ?? []) ids.add(t.projectId)
    return ids
  }, [myTasksQ.data])

  const invitableProjects = useMemo(() => {
    const all = projectsQ.data?.data ?? []
    return all.filter((p) => {
      const isOwnerOrAdmin = role === "ADMIN" || p.ownerId === currentUserId
      if (!isOwnerOrAdmin) return false
      // Chỉ những project mà người mời đã tạo task ở đó
      if (createdProjectIds.size > 0) return createdProjectIds.has(p.id)
      return true
    })
  }, [projectsQ.data, role, currentUserId, createdProjectIds])

  const selectedProject = (projectsQ.data?.data ?? []).find((p) => p.id === effectiveProjectId)

  const memberUserIds = useMemo(() => {
    const s = new Set<string>()
    for (const m of membersQ.data?.data ?? []) s.add(m.userId)
    if (selectedProject) s.add(selectedProject.ownerId)
    return s
  }, [membersQ.data, selectedProject])

  const candidates = useMemo(
    () => (usersQ.data?.data ?? []).filter((u) => !memberUserIds.has(u.id)),
    [usersQ.data, memberUserIds],
  )

  const canGrantPrivilegedRole = role === "ADMIN" || (!!selectedProject && selectedProject.ownerId === currentUserId)
  const effectiveRoleToSend: RoleType = canGrantPrivilegedRole ? selectedRole : "MEMBER"

  async function handleInvite() {
    if (!effectiveProjectId || !selectedUserId) return
    setErr(null)
    try {
      await addMut.mutateAsync({ userId: selectedUserId, role: effectiveRoleToSend })
      handleOpenChange(false)
    } catch (e: unknown) {
      setErr((e as { error?: string })?.error ?? (e as Error)?.message ?? "Lỗi mời thành viên")
    }
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v)
    if (!v) {
      if (!projectId) setSelectedProjectId("")
      setSelectedUserId("")
      setSelectedRole("MEMBER")
      setErr(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Mời thành viên vào project
          </DialogTitle>
          <DialogDescription>
            Chọn project (trong số các project bạn đã tạo task) và người dùng cần mời.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Project</Label>
            {projectId ? (
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">{selectedProject?.name ?? projectNameProp ?? projectId}</div>
            ) : (
            <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedUserId(""); setErr(null) }}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn project..." />
              </SelectTrigger>
              <SelectContent>
                {invitableProjects.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    {myTasksQ.isLoading || projectsQ.isLoading ? "Đang tải..." : "Chưa có project nào bạn đã tạo task trong đó."}
                  </div>
                ) : (
                  invitableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            )}
            {effectiveProjectId && selectedProject && (
              <p className="text-xs text-muted-foreground">Owner: {selectedProject.owner?.name ?? selectedProject.owner?.email ?? selectedProject.ownerId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Người dùng</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!effectiveProjectId}>
              <SelectTrigger>
                <SelectValue placeholder={effectiveProjectId ? "Chọn người để mời..." : "Chọn project trước"} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {effectiveProjectId && candidates.length === 0 && !usersQ.isLoading && !membersQ.isLoading && (
              <p className="text-xs text-muted-foreground">Không còn người nào có thể mời vào project này.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Vai trò trong project</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as RoleType)} disabled={!canGrantPrivilegedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {err && <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Đóng
          </Button>
          <Button disabled={!effectiveProjectId || !selectedUserId || addMut.isPending} onClick={handleInvite}>
            {addMut.isPending ? "Đang mời..." : "Mời"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
