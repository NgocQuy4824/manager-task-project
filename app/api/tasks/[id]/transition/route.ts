import { NextResponse } from "next/server"
// POST /api/tasks/[id]/transition — chuyển trạng thái (canTransition)
export async function POST(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Not implemented — transition ${params.id}. Use lib/workflow/canTransition` }, { status: 501 })
}
