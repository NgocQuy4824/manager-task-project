export type UserListItem = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  image?: string | null
}

export type UserDetail = {
  id: string
  email: string
  name: string | null
  role: string
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
