import { NextResponse } from "next/server"
export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Not implemented — user ${params.id}` }, { status: 501 })
}
export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Not implemented — user ${params.id}` }, { status: 501 })
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Not implemented — user ${params.id}` }, { status: 501 })
}
