import { dehydrate } from "@tanstack/react-query"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { getQueryClient } from "@/lib/query-client"
import { loadUsers } from "@/lib/server/loaders"
import { UsersPageContent } from "@/features/users/components/users-page"
import { HydrateClient } from "@/components/hydrate-client"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/tasks")

  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: ["users", { page: 1, pageSize: 20 }], queryFn: () => loadUsers({ page: 1, pageSize: 20 }) })

  return (
    <HydrateClient dehydratedState={dehydrate(qc)}>
      <UsersPageContent />
    </HydrateClient>
  )
}
