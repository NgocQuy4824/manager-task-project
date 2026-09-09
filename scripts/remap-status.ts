/* eslint-disable no-console */
import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  // Update mọi task có status nằm ngoài enum mới (CANCELLED / PAUSED) về TODO
  const res = await prisma.$runCommandRaw({
    update: "Task",
    updates: [
      {
        q: { status: { $in: ["CANCELLED", "PAUSED"] } },
        u: { $set: { status: "TODO" } },
        multi: true,
      },
    ],
  })
  console.log("remap task status:", JSON.stringify(res))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
