import { dehydrate } from "@tanstack/react-query"

import { getSession } from "@/lib/server-auth"
import { getQueryClient } from "@/lib/query-client"
import { loadProjects } from "@/lib/server/loaders"
import { ProjectsPageContent } from "@/features/projects/components/projects-page"
import { HydrateClient } from "@/components/hydrate-client"

export default async function ProjectsPage() {
  const user = await getSession()
  if (!user) return <ProjectsPageContent />

  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: ["projects", { page: 1 }], queryFn: () => loadProjects(user, { page: 1, pageSize: 20 }) })

  return (
    <HydrateClient dehydratedState={dehydrate(qc)}>
      <ProjectsPageContent />
    </HydrateClient>
  )
}
