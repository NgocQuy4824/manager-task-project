"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export function UserNav() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-sm underline">
          Đăng nhập
        </Link>
        <Link href="/register" className="text-sm underline">
          Đăng ký
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium">{session.user.name ?? session.user.email}</p>
        <p className="text-xs text-muted-foreground">{session.user.role}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
      >
        Đăng xuất
      </button>
    </div>
  )
}
