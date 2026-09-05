import { NextResponse } from "next/server"
// TODO: implement with lib/db + lib/validations/user
export async function GET() {
  return NextResponse.json({ message: "Not implemented — see features/users" }, { status: 501 })
}
export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 })
}
