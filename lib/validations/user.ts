import { z } from "zod"

export const userRoleSchema = z.enum([
  "ADMIN",
  "MANAGER",
  "MEMBER",
])

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ"),

  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(100, "Mật khẩu tối đa 100 ký tự"),

  name: z
    .string()
    .trim()
    .max(100, "Tên tối đa 100 ký tự")
    .optional(),

  role: userRoleSchema.default("MEMBER"),

  isActive: z
    .boolean()
    .default(true),
})

export const updateUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .optional(),

  name: z
    .string()
    .trim()
    .max(100, "Tên tối đa 100 ký tự")
    .optional(),

  role: userRoleSchema.optional(),

  isActive: z
    .boolean()
    .optional(),

  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(100, "Mật khẩu tối đa 100 ký tự")
    .optional(),
})

/* =========================================================
   CHANGE PASSWORD
   User tự đổi mật khẩu của chính mình
========================================================= */

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu hiện tại"),

    newPassword: z
      .string()
      .min(6, "Mật khẩu mới tối thiểu 6 ký tự")
      .max(100, "Mật khẩu mới tối đa 100 ký tự"),

    confirmPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine(
    (data) =>
      data.newPassword === data.confirmPassword,
    {
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) =>
      data.currentPassword !== data.newPassword,
    {
      message:
        "Mật khẩu mới phải khác mật khẩu hiện tại",
      path: ["newPassword"],
    }
  )

export type CreateUserInput =
  z.infer<typeof createUserSchema>

export type UpdateUserInput =
  z.infer<typeof updateUserSchema>

export type ChangePasswordInput =
  z.infer<typeof changePasswordSchema>