"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/lib/constants"
import type { RoleType } from "@/lib/constants"

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return nameOrEmail.slice(0, 2).toUpperCase()
}

export function UserNav() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Đăng nhập</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Đăng ký</Link>
        </Button>
      </div>
    )
  }

  const label = session.user.name ?? session.user.email ?? "?"
  const roleKey = session.user.role as RoleType
  const roleLabel = (ROLE_LABELS as Record<string, string>)[roleKey] ?? roleKey

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-sm font-semibold tracking-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft">
        {initials(label)}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Đăng xuất</span>
      </Button>
    </div>
  )
}
