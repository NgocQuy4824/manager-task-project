import { PrismaClient } from "./generated/prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

// DATABASE_URL là bắt buộc khi runtime query DB.
// Placeholder cho lúc `next build` chưa có env — adapter chỉ tạo pool config, chưa kết nối ngay.
// Khi deploy/thực thi query, process.env.DATABASE_URL phải là URL MySQL thật.
const connectionString =
  process.env.DATABASE_URL ?? "mysql://placeholder:placeholder@localhost:3306/placeholder"

const adapter = new PrismaMariaDb(connectionString)

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

export default db
