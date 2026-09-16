"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CheckSquare,
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
} from "lucide-react"
import { UserNav } from "./user-nav"
import { cn } from "@/lib/utils"

type Section = {
  title: string
  icon: typeof CheckSquare
  // gradient banner + màu chữ/icon accent khi ở section đó
  grad: string
  chip: string
}

// Map theo prefix route — đồng bộ bảng màu với sidebar
const SECTIONS: Record<string, Section> = {
  projects: {
    title: "Dự án",
    icon: FolderKanban,
    grad: "from-blue-500/15 via-transparent to-transparent",
    chip: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  tasks: {
    title: "Công việc",
    icon: ListChecks,
    grad: "from-emerald-500/15 via-transparent to-transparent",
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  users: {
    title: "Người dùng",
    icon: Users,
    grad: "from-amber-500/15 via-transparent to-transparent",
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
}

function resolve(pathname: string): { title: string; section: Section } {
  const seg = pathname.split("/").filter(Boolean)[0] ?? ""
  if (pathname === "/" || !SECTIONS[seg]) {
    return {
      title: pathname === "/" ? "Bảng điều khiển" : "Task Manager",
      section: {
        title: "Bảng điều khiển",
        icon: LayoutDashboard,
        grad: "from-violet-500/15 via-transparent to-transparent",
        chip: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      },
    }
  }
  const base = SECTIONS[seg]
  const detail =
    seg === "projects"
      ? "Chi tiết dự án"
      : seg === "tasks"
        ? "Chi tiết công việc"
        : "Chi tiết người dùng"
  const isDetail = pathname.split("/").filter(Boolean).length > 1
  return { title: isDetail ? detail : base.title, section: base }
}

export function Header() {
  const pathname = usePathname()
  const { title, section } = resolve(pathname)
  const Icon = section.icon

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-md md:px-6",
        "bg-gradient-to-r",
        section.grad,
        "bg-card/80",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground md:hidden"
        >
          <CheckSquare className="h-[18px] w-[18px]" />
        </Link>
        <span
          className={cn(
            "hidden h-8 w-8 items-center justify-center rounded-lg sm:flex",
            section.chip,
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h1 className="hidden text-lg font-semibold tracking-tight sm:block">
          {title}
        </h1>
      </div>
      <UserNav />
    </header>
  )
}
