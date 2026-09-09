/* eslint-disable no-console */
import { PrismaClient } from "../lib/generated/prisma"
const prisma = new PrismaClient()
async function main() {
  const raw: any = await prisma.$runCommandRaw({ distinct: "TaskTransition", key: "from" } as any)
  console.log("distinct from:", raw.values ?? raw)
  const raw2: any = await prisma.$runCommandRaw({ distinct: "TaskTransition", key: "to" } as any)
  console.log("distinct to:", raw2.values ?? raw2)
  // remap nếu còn CANCELLED/PAUSED ở transitions
  const r1 = await prisma.$runCommandRaw({
    update: "TaskTransition",
    updates: [{ q: { from: { $in: ["CANCELLED", "PAUSED"] } }, u: { $set: { from: "TODO" } }, multi: true }],
  })
  console.log("remap transition from:", JSON.stringify(r1))
  const r2 = await prisma.$runCommandRaw({
    update: "TaskTransition",
    updates: [{ q: { to: { $in: ["CANCELLED", "PAUSED"] } }, u: { $set: { to: "TODO" } }, multi: true }],
  })
  console.log("remap transition to:", JSON.stringify(r2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
