import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession, unauthorized, forbidden, notFound } from "@/lib/server-auth"
import { canTransition } from "@/lib/workflow"
import { transitionTaskSchema } from "@/lib/validations/task"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const parsedTR = transitionTaskSchema.safeParse(body)
  if (!parsedTR.success) return NextResponse.json({ error: parsedTR.error.flatten() }, { status: 422 })
  const targetStatus = parsedTR.data.status
  const reasonRaw = parsedTR.data.reason?.trim() ?? ""

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task) return notFound()

  // Từ chối (DONE → REJECTED): bắt buộc có lý do
  if (targetStatus === "REJECTED" && !reasonRaw) {
    return NextResponse.json({ error: "Vui lòng nhập lý do khi từ chối task" }, { status: 422 })
  }
  // Yêu cầu làm lại (PENDING_ACCEPTANCE → TODO): bắt buộc có lý do
  if (task.status === "PENDING_ACCEPTANCE" && targetStatus === "TODO" && !reasonRaw) {
    return NextResponse.json({ error: "Vui lòng nhập lý do khi yêu cầu làm lại" }, { status: 422 })
  }

  const allowed = canTransition(
    {
      creatorId: task.creatorId,
      assigneeId: task.assigneeId,
      executorId: task.executorId,
      status: task.status as never,
      isDraft: task.isDraft,
      pendingApproval: task.pendingApproval,
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
    if (task.status === "PENDING_ACCEPTANCE") {
      // Yêu cầu làm lại: lưu lý do để user thấy trên cột Cần làm
      data.reviewNote = reasonRaw
    } else if (task.status === "REJECTED") {
      // Làm lại từ trạng thái bị từ chối: xóa lý do cũ
      data.reviewNote = null
    }
  }
  if (targetStatus === "IN_PROGRESS") {
    data.pendingApproval = false
  }
  if (targetStatus === "REJECTED") {
    // Từ chối: lưu lý do để hiển thị trên chi tiết
    data.pendingApproval = false
    data.reviewNote = reasonRaw
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
