import { dehydrate } from "@tanstack/react-query"

import { getSession } from "@/lib/server-auth"
import { getQueryClient } from "@/lib/query-client"
import { loadStats } from "@/lib/server/loaders"

import { DashboardPageContent } from "@/features/dashboard/components/dashboard-page"
import { HydrateClient } from "@/components/hydrate-client"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return <DashboardPageContent />
  }

  const queryClient = getQueryClient()

  const initial = await loadStats(user)

  if (!("forbidden" in initial)) {
    await queryClient.prefetchQuery({
      queryKey: ["stats", ""],
      queryFn: async () => initial,
    })
  }

  return (
    <HydrateClient dehydratedState={dehydrate(queryClient)}>
      <DashboardPageContent />
    </HydrateClient>
  )
}