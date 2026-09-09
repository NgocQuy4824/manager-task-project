import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

async function main() {
  const password = await bcrypt.hash("password123", 10)

  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", password, name: "Admin", role: "ADMIN" },
  })

  const manager = await db.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: { email: "manager@example.com", password, name: "Manager", role: "MANAGER" },
  })

  const member = await db.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: { email: "member@example.com", password, name: "Member", role: "MEMBER" },
  })

  console.log({ admin: admin.email, manager: manager.email, member: member.email })

  const project = await db.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Demo Project",
      description: "Seed project for development",
      ownerId: admin.id,
    },
  })

  // Thêm members vào project
  for (const u of [manager, member]) {
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: u.id } },
      update: {},
      create: { projectId: project.id, userId: u.id, role: u.role },
    })
  }

  // Vài task mẫu — mỗi luồng một cái
  await db.task.createMany({
    data: [
      {
        title: "Luồng 1: Admin tạo — Manager nhận — Member làm",
        status: "TODO",
        priority: "HIGH",
        projectId: project.id,
        creatorId: admin.id,
        assigneeId: manager.id,
        executorId: member.id,
      },
      {
        title: "Luồng 2: Manager vừa tạo vừa giao — Member làm",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        projectId: project.id,
        creatorId: manager.id,
        assigneeId: manager.id,
        executorId: member.id,
      },
      {
        title: "Luồng 3: Manager giao cho chính mình",
        status: "IN_PROGRESS",
        priority: "LOW",
        projectId: project.id,
        creatorId: manager.id,
        assigneeId: manager.id,
        executorId: manager.id,
      },
    ],
  })

  console.log("Seed done:", { project: project.name })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
