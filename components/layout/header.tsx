"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckSquare } from "lucide-react"
import { UserNav } from "./user-nav"

const TITLES: Record<string, string> = {
  "/": "Bảng điều khiển",
  "/projects": "Dự án",
  "/tasks": "Công việc",
  "/users": "Người dùng",
}

function resolveTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname]
  const seg = pathname.split("/").filter(Boolean)[0]
  if (seg === "projects") return "Chi tiết dự án"
  if (seg === "tasks") return "Chi tiết công việc"
  if (seg === "users") return "Chi tiết người dùng"
  return "Task Manager"
}

export function Header() {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground md:hidden"
        >
          <CheckSquare className="h-[18px] w-[18px]" />
        </Link>
        <h1 className="hidden text-lg font-semibold tracking-tight sm:block">
          {title}
        </h1>
      </div>
      <UserNav />
    </header>
  )
}
