import Link from "next/link"
import { UserNav } from "./user-nav"

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <Link href="/" className="text-sm font-semibold md:hidden">
        Task Manager
      </Link>
      <div className="flex-1" />
      <UserNav />
    </header>
  )
}
