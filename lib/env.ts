import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

function loadEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  })

  if (!parsed.success) {
    // Trong build-time chưa có DATABASE_URL có thể skip — chỉ throw khi runtime thực sự cần DB.
    // Nhưng log rõ ràng để dev biết.
    const formatted = parsed.error.format()
    console.warn("[env] Validation warnings:", JSON.stringify(formatted, null, 2))
  }

  return parsed
}

export const envValidation = loadEnv()

/**
 * Gọi ở đầu server entry nếu muốn fail-fast khi thiếu env bắt buộc.
 * Ví dụ: import { assertEnv } from "@/lib/env"; assertEnv();
 */
export function assertEnv() {
  const result = loadEnv()
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`)
  }
}
