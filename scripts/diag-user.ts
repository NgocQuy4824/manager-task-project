import { PrismaClient } from "../lib/generated/prisma"

const db = new PrismaClient()

async function main() {
  const email = "quanly@gmail.com"
  const user = await db.user.findUnique({ where: { email } })
  console.log(
    JSON.stringify(
      {
        email,
        found: !!user,
        keys: user ? Object.keys(user) : null,
        user: user
          ? {
              id: (user as unknown as Record<string, unknown>).id,
              email: (user as unknown as Record<string, unknown>).email,
              name: (user as unknown as Record<string, unknown>).name,
              role: (user as unknown as Record<string, unknown>).role,
              isActive: (user as unknown as Record<string, unknown>).isActive,
              createdAt: (user as unknown as Record<string, unknown>).createdAt,
            }
          : null,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
