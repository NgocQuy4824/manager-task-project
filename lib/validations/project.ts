import { z } from "zod"

export const createProjectSchema = z.object({
  name: z.string().min(1, "Tên project không được để trống").max(200),
  description: z.string().max(5000).optional().nullable(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
