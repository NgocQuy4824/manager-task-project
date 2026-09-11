"use client"

import {
  useState,
  type FormEvent,
} from "react"

import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"



type ChangePasswordFormProps = {
  onSuccess?: () => void
}

type PasswordField =
  | "currentPassword"
  | "newPassword"
  | "confirmPassword"

export default function ChangePasswordForm({
  onSuccess,
}: ChangePasswordFormProps) {


  const [currentPassword, setCurrentPassword] =
    useState("")

  const [newPassword, setNewPassword] =
    useState("")

  const [confirmPassword, setConfirmPassword] =
    useState("")

  const [showPassword, setShowPassword] =
    useState<Record<PasswordField, boolean>>({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    })

  const [loading, setLoading] =
    useState(false)

  const togglePassword = (
    field: PasswordField
  ) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!currentPassword) {
      toast.error(
        "Vui lòng nhập mật khẩu hiện tại"
      )
      return
    }

    if (newPassword.length < 6) {
      toast.error(
        "Mật khẩu mới phải có ít nhất 6 ký tự"
      )
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "Mật khẩu xác nhận không khớp"
      )
      return
    }

    if (currentPassword === newPassword) {
      toast.error(
        "Mật khẩu mới phải khác mật khẩu hiện tại"
      )
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        "/api/users/change-password",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      )

      const result =
        await response.json().catch(() => null)

      if (!response.ok) {
        let message =
          "Không thể đổi mật khẩu"

        if (
          typeof result?.error === "string"
        ) {
          message = result.error
        }

        toast.error(message)
        return
      }

      toast.success(
        "Đổi mật khẩu thành công"
      )

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onSuccess?.()
      
    } catch (error) {
      console.error(
        "CHANGE PASSWORD CLIENT ERROR:",
        error
      )

      toast.error(
        "Không thể kết nối đến máy chủ"
      )
    } finally {
      setLoading(false)
    }
  }

  const renderPasswordInput = (
    field: PasswordField,
    label: string,
    value: string,
    setValue: (
      value: string
    ) => void,
    placeholder: string
  ) => {
    const visible =
      showPassword[field]

    return (
      <div className="space-y-2">
        <Label htmlFor={field}>
          {label}
        </Label>

        <div className="relative">
          <LockKeyhole
            className="
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            id={field}
            type={
              visible
                ? "text"
                : "password"
            }
            value={value}
            onChange={(event) =>
              setValue(event.target.value)
            }
            placeholder={placeholder}
            autoComplete={
              field === "currentPassword"
                ? "current-password"
                : "new-password"
            }
            disabled={loading}
            className="pl-9 pr-10"
          />

          <button
            type="button"
            onClick={() =>
              togglePassword(field)
            }
            disabled={loading}
            aria-label={
              visible
                ? "Ẩn mật khẩu"
                : "Hiện mật khẩu"
            }
            className="
              absolute
              right-2
              top-1/2
              flex
              h-8
              w-8
              -translate-y-1/2
              items-center
              justify-center
              rounded-md
              text-muted-foreground
              transition-colors
              hover:bg-muted
              hover:text-foreground
            "
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-4 w-4 text-primary" />
        </div>

        <div>
          <p className="text-sm font-medium">
            Đổi mật khẩu
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Sử dụng mật khẩu mới có ít nhất
            6 ký tự. Bạn sẽ cần sử dụng mật
            khẩu mới trong lần đăng nhập tiếp
            theo.
          </p>
        </div>
      </div>

      {renderPasswordInput(
        "currentPassword",
        "Mật khẩu hiện tại",
        currentPassword,
        setCurrentPassword,
        "Nhập mật khẩu hiện tại"
      )}

      {renderPasswordInput(
        "newPassword",
        "Mật khẩu mới",
        newPassword,
        setNewPassword,
        "Nhập mật khẩu mới"
      )}

      {renderPasswordInput(
        "confirmPassword",
        "Xác nhận mật khẩu mới",
        confirmPassword,
        setConfirmPassword,
        "Nhập lại mật khẩu mới"
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang cập nhật...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" />
            Đổi mật khẩu
          </>
        )}
      </Button>
    </form>
  )
}