import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound, conflict } from "@/lib/server-auth"
import { canTransition, isTaskFrozen } from "@/lib/workflow"
import { transitionTaskSchema } from "@/lib/validations/task"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const parsedTR = transitionTaskSchema.safeParse(body)
  if (!parsedTR.success) return NextResponse.json({ error: parsedTR.error.flatten() }, { status: 422 })
  const targetStatus = parsedTR.data.status
  const reasonRaw = parsedTR.data.reason?.trim() ?? ""

  const task = await db.task.findUnique({ where: { id: params.id }, include: { project: { select: { ownerId: true } } } })
  if (!task) return notFound()
  const projectOwnerId = (task as unknown as { project?: { ownerId: string } | null }).project?.ownerId ?? null

  // Guard: task bị đóng băng khi assignee hoặc executor đã bị vô hiệu hóa
  {
    const ids = [task.assigneeId, task.executorId].filter(Boolean) as string[]
    if (ids.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, isActive: true },
      })
      const byId = new Map(users.map((u) => [u.id, u]))
      const assignee = task.assigneeId ? (byId.get(task.assigneeId) as { isActive?: boolean } | undefined) ?? null : null
      const executor = task.executorId ? (byId.get(task.executorId) as { isActive?: boolean } | undefined) ?? null : null
      if (isTaskFrozen(assignee, executor)) {
        return conflict(
          "Task đang bị đóng băng vì người được giao/người thực hiện đã bị vô hiệu hóa. Vui lòng gán lại cho thành viên đang hoạt động trước khi chuyển trạng thái.",
        )
      }
    }
  }

  // Trả về làm lại (PENDING_ACCEPTANCE / DONE → IN_PROGRESS): bắt buộc có lý do
  if (targetStatus === "IN_PROGRESS" && (task.status === "PENDING_ACCEPTANCE" || task.status === "DONE") && !reasonRaw) {
    return NextResponse.json({ error: "Vui lòng nhập lý do khi trả task về làm lại" }, { status: 422 })
  }
  // Từ chối ở cổng phê duyệt: bắt buộc có lý do
  if (targetStatus === "REJECTED" && !reasonRaw) {
    return NextResponse.json({ error: "Vui lòng nhập lý do khi từ chối task" }, { status: 422 })
  }

  const allowed = canTransition(
    {
      creatorId: task.creatorId,
      assigneeId: task.assigneeId,
      executorId: task.executorId,
      status: task.status as never,
      isDraft: task.isDraft,
      pendingApproval: task.pendingApproval,
      projectOwnerId,
    },
    { id: user.id, role: user.role },
    targetStatus as never,
  )
  if (!allowed) return forbidden("Bạn không có quyền chuyển trạng thái này")

  const data: Record<string, unknown> = { status: targetStatus }

  if (targetStatus === "PENDING_ACCEPTANCE") {
    // Gửi nghiệm thu: xóa cờ chờ duyệt và lý do trả về cũ
    data.pendingApproval = false
    data.reviewNote = null
  }
  if (targetStatus === "DONE") {
    // Nghiệm thu hoàn thành
    data.pendingApproval = false
    data.isDraft = false
  }
  if (targetStatus === "TODO") {
    data.pendingApproval = false
    if (task.status === "REJECTED") {
      // Làm lại từ trạng thái bị từ chối: xóa lý do cũ
      data.reviewNote = null
    }
  }
  if (targetStatus === "REJECTED") {
    data.pendingApproval = false
    data.reviewNote = reasonRaw
  }
  if (targetStatus === "IN_PROGRESS") {
    data.pendingApproval = false
    data.isDraft = false
    if (task.status === "PENDING_ACCEPTANCE" || task.status === "DONE") {
      // Trả về làm lại: lưu lý do để người thực hiện thấy trên cột Đang làm
      data.reviewNote = reasonRaw
    } else {
      data.reviewNote = null
    }
  }

  const updated = await db.task.update({ where: { id: params.id }, data: data as never })

  // Ghi lịch sử chuyển trạng thái (mỗi lần 1 bản ghi có ID riêng)
  await db.taskTransition.create({
    data: {
      taskId: task.id,
      from: task.status as never,
      to: targetStatus as never,
      actorId: user.id,
      reason: reasonRaw || null,
    },
  })

  return NextResponse.json({ data: updated })
}
