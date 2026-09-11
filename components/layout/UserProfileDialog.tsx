"use client"

import { useState } from "react"

import {
  Mail,
  Shield,
  User,
  CheckCircle2,
  KeyRound,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"



import { Button } from "@/components/ui/button"

import { ROLE_LABELS } from "@/lib/constants"
import type { RoleType } from "@/lib/constants"

import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm"

type UserProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  email: string
  role: string
}

export function UserProfileDialog({
  open,
  onOpenChange,
  name,
  email,
  role,
}: UserProfileDialogProps) {
  const [showChangePassword, setShowChangePassword] =
    useState(false)

  const roleKey = role as RoleType

  const roleLabel =
    (ROLE_LABELS as Record<string, string>)[
      roleKey
    ] ?? role

  const displayName =
    name?.trim() || "Chưa cập nhật"

  const handleOpenChange = (
    nextOpen: boolean
  ) => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setShowChangePassword(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-md">
        {!showChangePassword ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin tài khoản
              </DialogTitle>

              <DialogDescription>
                Thông tin tài khoản của bạn
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Avatar */}

              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                  {getInitials(displayName)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {displayName}
                  </p>

                  <p className="truncate text-sm text-muted-foreground">
                    {email}
                  </p>
                </div>
              </div>

              {/* User information */}

              <div className="space-y-4">
                <InfoRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Họ và tên"
                  value={displayName}
                />

                <InfoRow
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="Email"
                  value={email}
                />

                <InfoRow
                  icon={
                    <Shield className="h-4 w-4" />
                  }
                  label="Vai trò"
                  value={roleLabel}
                />

                <InfoRow
                  icon={
                    <CheckCircle2 className="h-4 w-4" />
                  }
                  label="Trạng thái"
                  value="Đang hoạt động"
                  valueClassName="text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="h-px w-full bg-border" />

              {/* Change password */}

              <div className="rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <KeyRound className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Bảo mật tài khoản
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Thay đổi mật khẩu để bảo vệ
                      tài khoản của bạn.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() =>
                    setShowChangePassword(true)
                  }
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Đổi mật khẩu
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Đổi mật khẩu
              </DialogTitle>

              <DialogDescription>
                Cập nhật mật khẩu đăng nhập của
                tài khoản
              </DialogDescription>
            </DialogHeader>

            <ChangePasswordForm
                onSuccess={() => {
                 setShowChangePassword(false)
                    onOpenChange(false)
             }}
            />

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() =>
                setShowChangePassword(false)
              }
            >
              Quay lại thông tin tài khoản
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* =========================================================
   INFO ROW
========================================================= */

type InfoRowProps = {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}

function InfoRow({
  icon,
  label,
  value,
  valueClassName,
}: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-sm font-medium ${
            valueClassName ?? ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  nameOrEmail: string
) {
  const value = nameOrEmail.trim()

  if (!value) {
    return "?"
  }

  const parts = value.split(/\s+/)

  if (parts.length >= 2) {
    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase()
  }

  return value
    .slice(0, 2)
    .toUpperCase()
}