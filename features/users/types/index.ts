export { createUserSchema, updateUserSchema } from "@/lib/validations/user"

export type {
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/validations/user"

export type UserRole = "ADMIN" | "MANAGER" | "MEMBER"

export type UserListItem = {
  id: string
  email: string
  name: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt?: string
  image?: string | null
}

export type UserDetail = {
  id: string
  email: string
  name: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
  image?: string | null
}

export type UsersResponse = {
  data: UserListItem[]
  total: number
  page: number
  pageSize: number
}