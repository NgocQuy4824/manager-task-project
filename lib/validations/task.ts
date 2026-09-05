import { z } from "zod"

export const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "PENDING_APPROVAL", "DONE", "CANCELLED"])
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])

export const createTaskSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(300),
  description: z.string().max(10000).optional().nullable(),
  status: taskStatusEnum.default("TODO"),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: z.coerce.date().optional().nullable(),
  isDraft: z.boolean().default(false),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().optional().nullable(),
  executorId: z.string().cuid().optional().nullable(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  isDraft: z.boolean().optional(),
  pendingApproval: z.boolean().optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  executorId: z.string().cuid().optional().nullable(),
})

export const taskQuerySchema = z.object({
  projectId: z.string().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assigneeId: z.string().optional(),
  executorId: z.string().optional(),
  creatorId: z.string().optional(),
  search: z.string().optional(),
  isDraft: z.coerce.boolean().optional(),
  pendingApproval: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>
