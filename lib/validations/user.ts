import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(100),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]).default("MEMBER"),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]).optional(),
  email: z.string().email().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
