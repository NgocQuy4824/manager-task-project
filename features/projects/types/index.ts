export type ProjectListItem = {
  id: string
  name: string
  description?: string | null
  ownerId: string
  createdAt: string
  owner?: { id: string; name: string | null; email: string }
  _count?: { members: number; tasks: number }
}

export type ProjectDetail = {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  owner: { id: string; name: string | null; email: string }
  members: { id: string; userId: string; projectId: string; user: { id: string; name: string | null; email: string; role: string } }[]
  _count: { tasks: number }
}

export type ProjectsResponse = {
  data: ProjectListItem[]
  total: number
  page: number
  pageSize: number
}
