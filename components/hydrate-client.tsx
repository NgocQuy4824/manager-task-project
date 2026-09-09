import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { getQueryClient } from "@/lib/query-client"

export function HydrateClient({
  children,
  dehydratedState,
}: {
  children: React.ReactNode
  dehydratedState: ReturnType<typeof dehydrate>
}) {
  return <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
}

export { dehydrate, getQueryClient }
