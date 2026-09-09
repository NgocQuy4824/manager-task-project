import { dehydrate } from "@tanstack/react-query"

import { getSession } from "@/lib/server-auth"
import { getQueryClient } from "@/lib/query-client"
import { loadStats } from "@/lib/server/loaders"
import { DashboardPageContent } from "@/features/dashboard/components/dashboard-page"
import { HydrateClient } from "@/components/hydrate-client"

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) return <DashboardPageContent />

  const qc = getQueryClient()
  const initial = await loadStats(user)
  if (!("forbidden" in initial)) {
    await qc.prefetchQuery({ queryKey: ["stats", ""], queryFn: () => Promise.resolve(initial) })
    // Keep client follow-up fetch consistent: prefetch stats-adjacent project list the Dashboard also queries
    // Do not block render on it.
  }

  return (
    <HydrateClient dehydratedState={dehydrate(qc)}>
      <DashboardPageContent />
    </HydrateClient>
  )
}
