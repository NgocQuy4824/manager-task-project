import { db } from "@/lib/db"

async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, role: true } })
  console.log("USERS:", users)
  const projects = await db.project.findMany({ include: { owner: { select: { id: true, email: true } }, _count: { select: { members: true, tasks: true } } }, orderBy: { createdAt: "desc" } })
  type ProjectWithJoins = (typeof projects)[number] & { owner: { id: string; email: string | null } | null; _count: { members: number; tasks: number } }
  console.log("PROJECTS:", JSON.stringify((projects as ProjectWithJoins[]).map(p => ({ id: p.id, name: p.name, ownerId: p.ownerId, ownerEmail: p.owner?.email, createdAt: p.createdAt, counts: p._count })), null, 2))
  // Simulate loadProjects for each user
  for (const u of users) {
    const visibleWhere = u.role === "ADMIN" ? {} : { OR: [{ ownerId: u.id }, { members: { some: { userId: u.id } } }] }
    const where = visibleWhere
    const list = await db.project.findMany({ where: where as never, select: { id: true, name: true, ownerId: true } })
    const total = await db.project.count({ where: where as never })
    console.log(`VISIBLE for ${u.email} (${u.role}, ${u.id}): total=${total} ids=`, list.map(x=>x.id))
  }
}
main().catch(e=>{ console.error(e); process.exit(1)}).finally(()=>db.$disconnect())
