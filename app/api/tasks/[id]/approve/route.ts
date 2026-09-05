import { NextResponse } from "next/server"
// POST /api/tasks/[id]/approve — duyệt task (canApprove)
export async function POST(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Not implemented — approve ${params.id}. Use lib/workflow/canApprove` }, { status: 501 })
}
