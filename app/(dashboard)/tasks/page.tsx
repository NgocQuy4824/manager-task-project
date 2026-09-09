import { dehydrate } from "@tanstack/react-query"

import { getSession } from "@/lib/server-auth"
import { getQueryClient } from "@/lib/query-client"
import { loadTasks } from "@/lib/server/loaders"
import { TasksPageContent } from "@/features/tasks/components/tasks-page"
import { HydrateClient } from "@/components/hydrate-client"

export default async function TasksPage({ searchParams }: { searchParams?: { projectId?: string } }) {
  const user = await getSession()
  const projectId = searchParams?.projectId
  if (!user || !projectId) {
    return <TasksPageContent />
  }

  const qc = getQueryClient()
  const params = { projectId, page: 1, pageSize: 50 }
  const initial = await loadTasks(user, params)
  if (!("forbidden" in initial)) {
    await qc.prefetchQuery({ queryKey: ["tasks", params], queryFn: () => Promise.resolve(initial) })
  }

  return (
    <HydrateClient dehydratedState={dehydrate(qc)}>
      <TasksPageContent />
    </HydrateClient>
  )
}
