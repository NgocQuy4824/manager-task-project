/* eslint-disable no-console */
import { PrismaClient } from "../lib/generated/prisma"
import type { Prisma } from "../lib/generated/prisma"
const prisma = new PrismaClient()
async function main() {
  const raw = await prisma.$runCommandRaw({ distinct: "TaskTransition", key: "from" } as Prisma.InputJsonObject) as { values?: unknown }
  console.log("distinct from:", (raw as { values?: unknown }).values ?? raw)
  const raw2 = await prisma.$runCommandRaw({ distinct: "TaskTransition", key: "to" } as Prisma.InputJsonObject) as { values?: unknown }
  console.log("distinct to:", (raw2 as { values?: unknown }).values ?? raw2)
  // remap nếu còn CANCELLED/PAUSED ở transitions
  const r1 = await prisma.$runCommandRaw({
    update: "TaskTransition",
    updates: [{ q: { from: { $in: ["CANCELLED", "PAUSED"] } }, u: { $set: { from: "TODO" } }, multi: true }],
  } as Prisma.InputJsonObject)
  console.log("remap transition from:", JSON.stringify(r1))
  const r2 = await prisma.$runCommandRaw({
    update: "TaskTransition",
    updates: [{ q: { to: { $in: ["CANCELLED", "PAUSED"] } }, u: { $set: { to: "TODO" } }, multi: true }],
  } as Prisma.InputJsonObject)
  console.log("remap transition to:", JSON.stringify(r2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
