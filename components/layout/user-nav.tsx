"use client"

import { useState } from "react"

import {
  signOut,
  useSession,
} from "next-auth/react"

import Link from "next/link"

import {
  LogOut,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  ROLE_LABELS,
} from "@/lib/constants"

import type {
  RoleType,
} from "@/lib/constants"

import {
  UserProfileDialog,
} from "@/components/layout/UserProfileDialog"

/* =========================================================
   INITIALS
========================================================= */

function initials(
  nameOrEmail: string
) {
  const value = nameOrEmail.trim()

  if (!value) {
    return "?"
  }

  const parts =
    value.split(/\s+/)

  if (parts.length >= 2) {
    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase()
  }

  return value
    .slice(0, 2)
    .toUpperCase()
}

/* =========================================================
   USER NAV
========================================================= */

export function UserNav() {
  const {
    data: session,
    status,
  } = useSession()

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false)

  /* =======================================================
     LOADING
  ======================================================= */

  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
    )
  }

  /* =======================================================
     CHƯA ĐĂNG NHẬP
  ======================================================= */

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link href="/login">
            Đăng nhập
          </Link>
        </Button>

        <Button
          size="sm"
          asChild
        >
          <Link href="/register">
            Đăng ký
          </Link>
        </Button>
      </div>
    )
  }

  /* =======================================================
     USER INFO
  ======================================================= */

  const label =
    session.user.name ??
    session.user.email ??
    "?"

  const email =
    session.user.email ?? ""

  const roleKey =
    session.user.role as RoleType

  const roleLabel =
    (
      ROLE_LABELS as Record<
        string,
        string
      >
    )[roleKey] ?? roleKey

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="flex items-center gap-3">
        {/* ================================================
            USER INFO
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            setProfileOpen(true)
          }
          className="
            group
            flex
            items-center
            gap-3
            rounded-lg
            px-2
            py-1.5
            text-left
            transition-colors
            hover:bg-muted/70
            focus:outline-none
            focus:ring-2
            focus:ring-primary/30
          "
          aria-label="Mở thông tin tài khoản"
        >
          {/* Text */}

          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold tracking-tight">
              {label}
            </p>

            <p className="text-xs text-muted-foreground">
              {roleLabel}
            </p>
          </div>

          {/* Avatar */}

          <div className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-primary
            text-sm
            font-bold
            text-primary-foreground
            shadow-soft
            transition-transform
            group-hover:scale-105
          ">
            {initials(label)}
          </div>
        </button>

        {/* ================================================
            LOGOUT
        ================================================= */}

        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="
            gap-1.5
            text-muted-foreground
            hover:text-foreground
          "
        >
          <LogOut className="h-4 w-4" />

          <span className="hidden sm:inline">
            Đăng xuất
          </span>
        </Button>
      </div>

      {/* =================================================
          PROFILE DIALOG
      ================================================= */}

      <UserProfileDialog
        open={profileOpen}
        onOpenChange={
          setProfileOpen
        }
        name={
          session.user.name ?? ""
        }
        email={email}
        role={roleKey}
      />
    </>
  )
}