import { db } from "@/lib/db"

async function simulateDetail(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      _count: { select: { tasks: true } },
      members: { select: { id: true, userId: true, projectId: true, role: true } },
    },
  })
  if (!project) return console.log("not found", projectId)

  const memberUserIds = Array.from(new Set(project.members.map((m) => m.userId)))
  const [owner, memberUsers] = await Promise.all([
    db.user.findUnique({ where: { id: project.ownerId }, select: { id: true, name: true, email: true } }),
    memberUserIds.length
      ? db.user.findMany({ where: { id: { in: memberUserIds } }, select: { id: true, name: true, email: true, role: true } })
      : Promise.resolve([]),
  ])
  const userMap = new Map(memberUsers.map((u) => [u.id, u]))
  const members = project.members.flatMap((m) => (userMap.get(m.userId) ? [{ ...m, user: userMap.get(m.userId)! }] : []))
  console.log("DETAIL ok:", project.id, "owner:", owner?.email ?? null, "rawMembers:", project.members.length, "resolvedMembers:", members.length)
}

async function main() {
  const rows = await db.project.findMany({ select: { id: true, name: true, ownerId: true } })
  const ownerIds = Array.from(new Set(rows.map((r) => r.ownerId)))
  const owners = await db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, email: true } })
  const m = new Map(owners.map((o) => [o.id, o]))
  const data = rows.map((p) => ({ ...p, owner: m.get(p.ownerId) ?? null }))
  console.log("LIST OK rows:", data.length)
  console.log(JSON.stringify(data.map((d) => ({ id: d.id, name: d.name, owner: (d.owner as { email?: string })?.email ?? null })), null, 2))

  const orphan = data.find((d) => !d.owner)
  if (orphan) {
    console.log("Simulating DETAIL for orphan project:", orphan.id)
    await simulateDetail(orphan.id)
  }
  console.log("VERIFY PASS")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
