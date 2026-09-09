"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/projects", label: "Dự án", icon: FolderKanban },
  { href: "/tasks", label: "Công việc", icon: ListChecks },
  { href: "/users", label: "Người dùng", icon: Users },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <CheckSquare className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <Link href="/" className="block text-sm font-bold tracking-tight">
            Task Manager
          </Link>
          <span className="block text-xs text-muted-foreground">
            Quản lý công việc
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tổng quan
        </p>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground",
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-xl bg-accent/60 p-3.5">
          <p className="text-xs font-semibold text-accent-foreground">
            Cần hỗ trợ?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Liên hệ quản trị viên để được cấp thêm quyền.
          </p>
        </div>
      </div>
    </aside>
  )
}
